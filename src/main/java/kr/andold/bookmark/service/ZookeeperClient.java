package kr.andold.bookmark.service;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import org.apache.zookeeper.CreateMode;
import org.apache.zookeeper.KeeperException;
import org.apache.zookeeper.WatchedEvent;
import org.apache.zookeeper.Watcher;
import org.apache.zookeeper.ZooDefs.Ids;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import kr.andold.utils.Utility;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import org.apache.zookeeper.ZooKeeper;

@Slf4j
@Service
public class ZookeeperClient implements Watcher {
	@Getter private static boolean isMaster = false;
	@Getter private static String currentZNodeName;

	private ZooKeeper zookeeper;

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
		log.info("{} run() - 『userZookeeperConnectString:{}』『userZookeeperZnodeElectPath:{}』", Utility.indentStart(), userZookeeperConnectString, userZookeeperZnodeElectPath);

		try {
			zookeeper = new ZooKeeper(userZookeeperConnectString, 3000, this);
		} catch (IOException e) {
			log.error("IOException:: {}", e.getMessage(), e);
		}

		log.info("{} run() - 『userZookeeperConnectString:{}』『userZookeeperZnodeElectPath:{}』", Utility.indentEnd(), userZookeeperConnectString, userZookeeperZnodeElectPath);
	}

	@Override
	public void process(WatchedEvent event) {
		log.info("{} process(『{}』)", Utility.indentStart(), event);

		switch(event.getType()) {
		case None:
			if (event.getState() == Event.KeeperState.SyncConnected) {
				log.info("{} process(『{}』) - Successfully connected to zookeeper!!", Utility.indentMiddle(), event);
				try {
//					zookeeper.create("/elect-bookmark", new byte[] {}, Ids.OPEN_ACL_UNSAFE, CreateMode.PERSISTENT);
//					zookeeper.create("/test/elect-bookmark", new byte[] {}, Ids.OPEN_ACL_UNSAFE, CreateMode.PERSISTENT);
					String zNodeFullPath = zookeeper.create(userZookeeperZnodeElectPath + "/c_", new byte[] {}, Ids.OPEN_ACL_UNSAFE, CreateMode.EPHEMERAL_SEQUENTIAL);
					currentZNodeName = zNodeFullPath.replace(userZookeeperZnodeElectPath + "/", "");
					log.info("{} process(『{}』) - 『zNodeFullPath:{}』『currentZNodeName:{}』", Utility.indentMiddle(), event, zNodeFullPath, currentZNodeName);
				} catch (KeeperException e) {
					log.error("KeeperException:: {}", e.getMessage(), e);
				} catch (InterruptedException e) {
					log.error("InterruptedException:: {}", e.getMessage(), e);
				}
			} else {
				synchronized (zookeeper) {
					log.info("{} process(『{}』) - Disconnected from zookeeper event", Utility.indentMiddle(), event);
					zookeeper.notifyAll();
				}
			}
		case NodeDeleted:
		case NodeCreated:
		case NodeDataChanged:
		case NodeChildrenChanged:
			try {
				List<String> children = zookeeper.getChildren(userZookeeperZnodeElectPath, this);
				ZookeeperClient.isMaster = isMaster(children);
			} catch(KeeperException e) {
			} catch(InterruptedException e) {
			}
			break;
		default:
			break;
		}
		
		log.info("{} process(『{}』)", Utility.indentEnd(), event);
	}

	private boolean isMaster(List<String> children) {
		log.info("{} isMaster({}) - {}", Utility.indentMiddle(), children, currentZNodeName);
		Collections.sort(children);
		String smallestChild = children.get(0);
		return smallestChild.equals(currentZNodeName);
	}

}
