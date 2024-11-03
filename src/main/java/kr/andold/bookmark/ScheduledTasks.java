package kr.andold.bookmark;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import kr.andold.bookmark.domain.BookmarkParam;
import kr.andold.bookmark.service.BookmarkService;
import kr.andold.utils.Utility;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
@EnableScheduling
@ConditionalOnProperty(value = "app.scheduling.enable", havingValue = "true", matchIfMissing = true)
public class ScheduledTasks {
	@Autowired
	private BookmarkService service;

	@Getter private static String dataPath;
	@Value("${data.path:C:/tmp}")
	public void setDataPath(String dataPath) {
		log.info("{} setDataPath({})", Utility.indentMiddle(), dataPath);
		ScheduledTasks.dataPath = dataPath;
		File directory = new File(dataPath);
		if (!directory.exists()) {
			log.info("{} NOT EXIST PATH setDataPath({})", Utility.indentMiddle(), dataPath);
			directory.mkdir();
		}
	}

	// 매일
	@Scheduled(cron = "0 47 0 * * *")
	public void scheduleTaskDaily() {
		log.info("{} scheduleTaskDaily()", Utility.indentStart());
		long started = System.currentTimeMillis();
		
		String yyyymmdd = LocalDate.now().minusDays(1).format(DateTimeFormatter.BASIC_ISO_DATE);

		BookmarkParam param = service.download();
		String text = Utility.toStringJsonPretty(param);
		String filenameCurrent = String.format("%s/bookmark.json", dataPath);
		String filenameYesterday = String.format("%s/bookmark-%s.json", dataPath, yyyymmdd);
		rename(filenameCurrent, filenameYesterday);
		Utility.write(filenameCurrent, text);

		log.info("{} scheduleTaskDaily() - {}", Utility.indentEnd(), Utility.toStringPastTimeReadable(started));
	}

	private void rename(String before, String after) {
		try {
			Path oldfile = Paths.get(before);
			Path newfile = Paths.get(after);
			Files.move(oldfile, newfile);
		} catch (IOException e) {
			log.error("{} IOException rename(『{}』, 『{}』) - 『{}』", Utility.indentMiddle(), before, after, e.getLocalizedMessage(), e);
		}
	}

}
