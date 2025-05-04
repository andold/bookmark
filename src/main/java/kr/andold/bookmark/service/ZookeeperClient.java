package kr.andold.bookmark.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import kr.andold.utils.Utility;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ZookeeperClient extends kr.andold.utils.ZookeeperClient {
	@Getter private static String userZookeeperConnectString;
	@Value("${user.zookeeper.connect.string}")
	public void setUserZookeeperConnectString(String value) {
		log.info("{} setUserZookeeperConnectString(『{}』)", Utility.indentMiddle(), value);
		userZookeeperConnectString = value;
	}

	@Getter private static String userZookeeperZnodeElectPath;
	@Value("${user.zookeeper.znode.elect.path}")
	public void setUserZookeeperZnodeElectPath(String value) {
		log.info("{} setUserZookeeperZnodeElectPath(『{}』)", Utility.indentMiddle(), value);
		userZookeeperZnodeElectPath = value;
	}

	public void run() {
		log.info("{} run() - 『{}』『{}』", Utility.indentStart(), userZookeeperConnectString, userZookeeperZnodeElectPath);

		super.run(userZookeeperConnectString, userZookeeperZnodeElectPath);

		log.info("{} run() - 『{}』『{}』", Utility.indentEnd(), userZookeeperConnectString, userZookeeperZnodeElectPath);
	}

}
