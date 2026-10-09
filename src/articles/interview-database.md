---
id: "interview-database"
title: "数据库面试题"
category: "数据库"
description: "收录 Q356–Q367 的参考答案、原理说明与配图。"
kind: "知识文章"
tags: ["MySQL","Redis","数据库"]
addedAt: "2026-10-08"
updatedAt: "2026-10-09"
order: 114
status: draft
quality: complete
sources: ["https://www.postgresql.org/docs/current/","https://dev.mysql.com/doc/"]
technologyVersion: "数据库概念；具体数据库语法与版本需逐题确认"
---

> 本专题已完成本轮技术内容修订。题号用于稳定定位；适用版本和来源见各题。教学示例按文中约定使用，原始配图保留作辅助参考。

补充参考资料：[参考 1](https://www.postgresql.org/docs/current/) · [参考 2](https://dev.mysql.com/doc/)。


## Q356｜数据库范式

适用：MySQL 8.4 / InnoDB；MongoDB 文档模型；Redis 与 Kafka 通用语义；UUID RFC 9562。

范式用于减少冗余与更新异常。1NF 要求关系中的属性值按模型定义保持原子性；2NF 在 1NF 上避免非主属性对候选键真子集的部分依赖；3NF 进一步约束传递依赖，严格定义按函数依赖与主属性判断。

例如订单明细以订单ID+商品ID为键时，商品名称通常属于商品表，客户信息属于客户表。规范化增加关联成本，报表/读取场景可有意识反规范化，但需明确数据来源、一致性和更新流程，不能把“表越多越好”当目标。

参考：[资料 1](https://en.wikipedia.org/wiki/Database_normalization)。

---

## Q357｜mysql 和 mongoDB 的区别

适用：MySQL 8.4 / InnoDB；MongoDB 文档模型；Redis 与 Kafka 通用语义；UUID RFC 9562。

MySQL 是关系型数据库，使用表、约束与 SQL，适合关系明确和事务性业务；MongoDB 以 BSON 文档组织数据，便于将聚合内相关字段嵌入。两者都有索引、复制、查询优化和事务能力，不能用“MongoDB 没有事务/关联”区分。

选择应看访问模式、数据约束、更新粒度和运维能力。文档可嵌套不等于无 schema，仍需校验与版本演进；关系表也支持 JSON。跨大量文档/表事务与分片查询都有成本，应围绕真实负载设计。

参考：[资料 1](https://dev.mysql.com/doc/refman/8.4/en/introduction.html) · [资料 2](https://www.mongodb.com/docs/manual/core/data-modeling-introduction/)。

---

## Q358｜mysql 索引规则

适用：MySQL 8.4 / InnoDB；MongoDB 文档模型；Redis 与 Kafka 通用语义；UUID RFC 9562。

以 MySQL 8.4 InnoDB 的 B-tree 复合索引 (a,b,c) 为例，最左前缀通常支持以 a 或 a,b 开始的查找与排序；范围条件后的列可能继续用于过滤/覆盖，但不能简单说“索引全部失效”。

覆盖索引可减少回表，选择性、排序、LIMIT 与数据分布影响优化器选择。函数、隐式转换、前置通配等可能不利索引利用，也存在函数索引/特定优化例外。用 EXPLAIN/EXPLAIN ANALYZE 验证实际计划；后者会实际执行查询，生产需控制成本。

参考：[资料 1](https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html) · [资料 2](https://dev.mysql.com/doc/refman/8.4/en/using-explain.html)。

---

## Q359｜mysql 索引优缺点

适用：MySQL 8.4 / InnoDB；MongoDB 文档模型；Redis 与 Kafka 通用语义；UUID RFC 9562。

索引通过额外数据结构加速查找、连接、排序或唯一性约束，覆盖索引还可减少访问主记录。代价是磁盘/内存、写入维护、页分裂和优化器选择复杂度。

索引不是越多越好，频繁写入表应按真实高频查询设计，检查重复/冗余索引和选择性。低选择性列也不是绝对不能索引，结合复合索引、覆盖与 LIMIT 可能有价值；以执行计划和读写测量判断。

参考：[资料 1](https://dev.mysql.com/doc/refman/8.4/en/optimization-indexes.html)。

---

## Q360｜mysql 的存储引擎

适用：MySQL 8.4 / InnoDB；MongoDB 文档模型；Redis 与 Kafka 通用语义；UUID RFC 9562。

MySQL 存储引擎负责表的数据与索引存储、锁及事务等行为。InnoDB 是常用默认引擎，支持事务、崩溃恢复、MVCC 与外键；MyISAM 属于旧场景，无事务支持；MEMORY 用内存存表且有持久性边界。

选择引擎需核对事务、持久化、索引和备份要求。不能只按“读多 MyISAM、写多 InnoDB”机械选择，也不能把临时表行为等同所有 MEMORY 表。生产一般优先 InnoDB，再用证据说明例外。

参考：[资料 1](https://dev.mysql.com/doc/refman/8.4/en/storage-engines.html)。

---

## Q361｜InnoDB 与 MyISAM 的区别

适用：MySQL 8.4 / InnoDB；MongoDB 文档模型；Redis 与 Kafka 通用语义；UUID RFC 9562。

InnoDB 支持事务、崩溃恢复、MVCC 与行级/范围锁，使用聚簇主键，二级索引关联主键。MyISAM 不支持事务和外键，主要使用表级锁，数据与索引存储方式不同。

InnoDB 也会有表级意向锁、间隙/next-key 锁，锁范围与索引及隔离级别有关，不能说它“永远只锁一行”。MyISAM 已不是新业务的默认性能方案；对比需包含恢复、一致性和并发写成本。

参考：[资料 1](https://dev.mysql.com/doc/refman/8.4/en/innodb-introduction.html) · [资料 2](https://dev.mysql.com/doc/refman/8.4/en/myisam-storage-engine.html)。

---

## Q362｜常用 SQL 语法

适用：MySQL 8.4 / InnoDB；MongoDB 文档模型；Redis 与 Kafka 通用语义；UUID RFC 9562。

SQL 常用 SELECT 查询、INSERT 插入、UPDATE 修改、DELETE 删除，DDL 如 CREATE/ALTER 管理结构。WHERE 筛选行，GROUP BY 聚合，HAVING 筛选分组，ORDER BY 排序；没有 ORDER BY 不保证固定顺序。

```sql
SELECT customer_id, COUNT(*) AS order_count, SUM(amount) AS total
FROM orders
WHERE status = 'paid'
GROUP BY customer_id
HAVING SUM(amount) > 1000
ORDER BY total DESC, customer_id ASC
LIMIT 20;
```

业务输入通过驱动参数绑定，不直接拼接。UPDATE/DELETE 执行前确认 WHERE 与影响行数，多步不变量用事务；聚合还需注意 NULL 与金额类型。

参考：[资料 1](https://dev.mysql.com/doc/refman/8.4/en/sql-statements.html)。

---

## Q363｜连表查询

适用：MySQL 8.4 / InnoDB；MongoDB 文档模型；Redis 与 Kafka 通用语义；UUID RFC 9562。

INNER JOIN 返回匹配行，LEFT JOIN 保留左表所有行并以 NULL 补齐未匹配右表。连接条件用 ON，结果筛选用 WHERE；把右表条件放在 WHERE 可能过滤掉 NULL 行，使 LEFT JOIN 表现类似内连接。

```sql
SELECT u.id, COUNT(o.id) AS paid_orders
FROM users AS u
LEFT JOIN orders AS o ON o.user_id = u.id AND o.status = 'paid'
GROUP BY u.id;
```

COUNT(o.id) 不统计补出的 NULL，COUNT(*) 则统计结果行。多对多连接可能放大行数，聚合前要检查基数；MySQL 不直接支持 FULL OUTER JOIN，不能照搬其他数据库语法。

参考：[资料 1](https://dev.mysql.com/doc/refman/8.4/en/join.html)。

---

## Q364｜Redis 是什么

适用：MySQL 8.4 / InnoDB；MongoDB 文档模型；Redis 与 Kafka 通用语义；UUID RFC 9562。

Redis 是内存数据结构服务，支持字符串、哈希、集合、有序集合、列表和 Stream 等，常用于缓存、计数、限流与协调。持久化可用 RDB/AOF，持久性保证取决于配置、复制与故障恢复。

单条命令原子不等于多步业务自动原子，可用事务/脚本并明确并发契约。需设置 TTL、淘汰策略与容量，防止缓存击穿和大 key 阻塞；复制和主从切换也不能自动保证所有已确认写永不丢失。

参考：[资料 1](https://redis.io/docs/latest/develop/get-started/) · [资料 2](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)。

---

## Q365｜kafka 是什么

适用：MySQL 8.4 / InnoDB；MongoDB 文档模型；Redis 与 Kafka 通用语义；UUID RFC 9562。

Kafka 是分布式事件流平台，以 topic/partition 存储追加日志，消费者用 offset 跟踪进度。保留期独立于某个消费者是否已读取，因此支持重放与多个消费组。

顺序保证主要在分区内；消费组中的分区分配支持并行处理。可靠性取决于副本、ack、提交 offset 和处理策略；“恰好一次”有事务和系统边界，不能自动覆盖外部数据库副作用。需考虑消息键、重复处理、积压与 schema 演进。

参考：[资料 1](https://kafka.apache.org/documentation/#intro_concepts_and_terms)。

---

## Q366｜redis 和 kafka 的区别

适用：MySQL 8.4 / InnoDB；MongoDB 文档模型；Redis 与 Kafka 通用语义；UUID RFC 9562。

Redis 主要提供低延迟数据结构操作，Kafka 主要提供可持久化、可重放的大规模分区事件日志。两者并非绝对互斥，Redis Streams 也有日志与消费组，Redis Pub/Sub 则不为断线订阅者持久保留消息。

选型比较持久化要求、吞吐、延迟、重放时长、消费组和运维成本，不能只用“内存 vs 磁盘”概括。业务需明确重复投递、顺序范围与失败恢复；既可用 Redis 缓存状态，又用 Kafka 传播事件。

参考：[资料 1](https://redis.io/docs/latest/develop/data-types/streams/) · [资料 2](https://kafka.apache.org/documentation/#intro_concepts_and_terms)。

---

## Q367｜数据不用 自增ID 做数据唯一标识的原因

适用：MySQL 8.4 / InnoDB；MongoDB 文档模型；Redis 与 Kafka 通用语义；UUID RFC 9562。

自增 ID 简单、紧凑且对 B-tree 写入友好，单库业务常适用；分布式独立生成、跨库合并或外部展示可能采用 UUID、时间有序 ID 或内部主键+外部随机 ID。不存在所有场景都必须抛弃自增的规则。

随机 UUID 更大且可能增加索引离散写入，时间有序 ID 可能泄漏时间并依赖时钟管理；任何 ID 都不能代替资源级授权。UUID 也不是数学上绝无碰撞。应明确唯一性范围、生成速率、排序、存储和可预测性要求。

参考：[资料 1](https://dev.mysql.com/doc/refman/8.4/en/innodb-auto-increment-handling.html) · [资料 2](https://www.rfc-editor.org/rfc/rfc9562)。

---
