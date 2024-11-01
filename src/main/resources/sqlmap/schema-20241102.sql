--
-- h2
--
drop sequence if exists HIBERNATE_SEQUENCES;
create sequence HIBERNATE_SEQUENCES start with 1024 increment by 1;


--drop table bookmark;
create table bookmark (
id			serial not null,
title		varchar(1024) DEFAULT '',
url			varchar(1024) DEFAULT '',
description	varchar(4096) DEFAULT '',
parent_id	integer DEFAULT 0,
count		integer DEFAULT 0,
status		integer DEFAULT 0,
created		timestamp DEFAULT CURRENT_TIMESTAMP,
updated		timestamp DEFAULT CURRENT_TIMESTAMP,
primary key (id));
alter sequence bookmark_id_seq restart with 1024;

