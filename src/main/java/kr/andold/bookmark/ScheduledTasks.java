package kr.andold.bookmark;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import kr.andold.bookmark.service.BookmarkService;
import kr.andold.utils.Utility;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
@EnableScheduling
@ConditionalOnProperty(value = "app.scheduling.enable", havingValue = "true", matchIfMissing = true)
public class ScheduledTasks {
	@Autowired
	private BookmarkService bookmarkService;

	// 매일
	@Scheduled(fixedDelay = 1000 * 60 * 60 * 24, initialDelay = 1000 * 60 * 60)
	public void scheduleTaskEveryDays() {
	}

}
