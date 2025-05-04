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
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import kr.andold.bookmark.domain.BookmarkParam;
import kr.andold.bookmark.service.BookmarkService;
import kr.andold.bookmark.service.ZookeeperClient;
import kr.andold.utils.Utility;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
@EnableScheduling
public class ScheduledTasks {
	@Autowired private BookmarkService service;
	@Autowired private ZookeeperClient zookeeperClient;

	@Getter private static String userDataPath;
	@Value("${user.data.path}")
	public void setUserDataPath(String dataPath) {
		log.info("{} setUserDataPath({})", Utility.indentMiddle(), dataPath);
		ScheduledTasks.userDataPath = dataPath;
		File directory = new File(dataPath);
		if (!directory.exists()) {
			log.info("{} NOT EXIST PATH setDataPath({})", Utility.indentMiddle(), dataPath);
			directory.mkdir();
		}
	}

	@Scheduled(initialDelay = 1000 * 8, fixedDelay = Long.MAX_VALUE)
	public void once() {
		log.info("{} once()", Utility.indentStart());
		long started = System.currentTimeMillis();
		
		zookeeperClient.run();
		
		log.info("{} once() - {}", Utility.indentEnd(), Utility.toStringPastTimeReadable(started));
	}

	// 매분마다
	@Scheduled(cron = "0 * * * * *")
	public void minutely() {
		log.trace("{} minutely()", Utility.indentStart());
		long started = System.currentTimeMillis();

		log.info("{} minutely() - {}", Utility.indentMiddle(), zookeeperClient.status(false));

		log.trace("{} minutely() - {}", Utility.indentEnd(), Utility.toStringPastTimeReadable(started));
	}

	// 매시간
	@Scheduled(cron = "0 56 * * * *")
	public void hourly() {
		log.trace("{} hourly()", Utility.indentStart());
		long started = System.currentTimeMillis();

		if (zookeeperClient.isMaster()) {
			service.aggreagateCount();
		}

		log.trace("{} hourly() - {}", Utility.indentEnd(), Utility.toStringPastTimeReadable(started));
	}

	// 매일
	@Scheduled(cron = "0 47 0 * * *")
	public void daily() {
		log.info("{} daily()", Utility.indentStart());
		long started = System.currentTimeMillis();
		
		if (zookeeperClient.isMaster()) {
			String yyyymmdd = LocalDate.now().minusDays(1).format(DateTimeFormatter.BASIC_ISO_DATE);

			BookmarkParam param = service.download();
			String text = Utility.toStringJsonPretty(param);
			String filenameCurrent = String.format("%s/bookmark.json", userDataPath);
			String filenameYesterday = String.format("%s/bookmark-%s.json", userDataPath, yyyymmdd);
			rename(filenameCurrent, filenameYesterday);
			Utility.write(filenameCurrent, text);
		}

		log.info("{} daily() - {}", Utility.indentEnd(), Utility.toStringPastTimeReadable(started));
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
