package kr.andold.bookmark;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import kr.andold.utils.Utility;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class ScheduledTasksTest {
	@Autowired private ScheduledTasks service;

	@Test
	public void testScheduleTaskDaily() {
		log.info("{} testScheduleTaskDaily() -----------------------------------------------------------", Utility.indentMiddle());
		service.daily();
	}

}
