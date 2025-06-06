#!/bin/bash
#
#
PROJECT=bookmark
PROFILE=linux
INSTALL_SCRIPT_FILE_NAME=install-$PROJECT-$PROFILE.sh
HOME_DIR=/home/andold
SOURCE_DIR=$HOME_DIR/src/github/$PROJECT
DEPLOY_DIR=$HOME_DIR/deploy/$PROJECT
TOMCAT_BIN_DIR=$HOME_DIR/apps/tomcat/bin
FILE_NAME_WAR=$SOURCE_DIR/build/libs/$PROJECT-0.0.1-SNAPSHOT.war
#
#
#
function	kill_tomcat	{
	# 종료되었는지 확인하고, 살아있으면 강제로 종료시킨다.
	if [ -z "`ps -eaf | grep java | grep $1 | grep -v grep`" ]; then
		echo "정보:: 톰캣이 이미 종료되었습니다." $1
		return 0
	fi

	echo    "경고:: 톰캣이 정상적으로 종료되지 않았습니다. 강제로 종료시킵니다."
	ps -eaf | grep java | grep $1 | grep -v grep | awk '{print $2}' |

	while read PID
	do
		echo "Killing $PID ..."
		kill -9 $PID
		echo "Tomcat is being shutdowned."
	done
}
#
function	stop_tomcat	{
	#       시작 로그
	echo    "----------------------------------------------------------------------"
	date
	#       정상적으로 톰캣을 종료시킨다.
	if [ -z "`ps -eaf | grep java | grep $1 | grep -v grep`" ]; then
		echo    "경고:: 톰캣이 실행되고 있지 않았습니다. $1"
		return 0
	fi

	echo    "정보:: 톰캣을 종료시킵니다." $1
	$1/shutdown.sh

	for cx in $(seq 1 16)
	do
		if [ -z "`ps -eaf | grep java | grep $1 | grep -v grep`" ]; then
			echo "정보:: 톰캣이 종료되었습니다." $1
			return 0
		fi

		echo	"wait..." $cx
		sleep 1
	done

	kill_tomcat	$1
}
#
function	start_tomcat    {
	echo    "----------------------------------------------------------------------"
	date
	echo "정보:: 톰캣을 실행시키기 전에, 톰캣의 실행되어 있으면, 종료 시킵니다.." $1
	kill_tomcat	$1

	# 톰캣을 실행시킨다.
	echo "정보:: 톰캣을 실행시킵니다. $1"
	$1/startup.sh
	sleep 1

	jps
	ps -eaf | grep java | grep $1 | grep -v grep
}
#
#
#
date
#
# build 
#
cd	$SOURCE_DIR
git clean -f
#
#
# react npm install
cd	$SOURCE_DIR/src/main/frontend
npm install --no-bin-links --force
npm audit fix --force
npm install react-scripts@latest --save
#
#
# build
#
cd	$SOURCE_DIR
bash gradlew build -Pprofile=$PROFILE -x test
#
#
# deploy and restart tomcat
#
stop_tomcat    $TOMCAT_BIN_DIR
#
#
#
#
echo "Remove file in $DEPLOY_DIR/doc_base"
#
cd	$DEPLOY_DIR/doc_base
rm -fr *
#
echo "Extract files from in $FILE_NAME_WAR"
jar -xf $FILE_NAME_WAR
#
start_tomcat     $TOMCAT_BIN_DIR
#
# copy myself install script file
#
cd $DEPLOY_DIR
cp $SOURCE_DIR/src/main/resources-$PROFILE/$INSTALL_SCRIPT_FILE_NAME	$DEPLOY_DIR
chmod a+x $INSTALL_SCRIPT_FILE_NAME
