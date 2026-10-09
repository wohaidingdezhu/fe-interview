---
id: "two-sum"
title: "两数之和"
category: "手写题"
kind: "手写题解"
description: "用哈希表把嵌套遍历变成一次遍历，并解释复杂度。"
tags: ["算法", "手写题", "面试"]
addedAt: "2026-10-08"
order: 5
status: published
quality: complete
---

## 题目描述

给定整数数组 `nums` 和目标值 `target`，返回数组中两个不同位置的下标，使它们的值相加等于 `target`。没有解时返回空数组；有多组解时返回找到的第一组。

```javascript
twoSum([2, 7, 11, 15], 9); // [0, 1]
twoSum([3, 3], 6);        // [0, 1]
twoSum([1, 2], 8);        // []
```

## 从暴力解到哈希表

两层循环能枚举所有不同的下标对，时间复杂度为 O(n²)。

换一个问题：遍历到 `current` 时，之前有没有见过 `target - current`？使用 Map 保存已经遍历过的数值及其下标，就可以直接查找。

## 代码实现

```javascript
function twoSum(nums, target) {
  const seen = new Map();

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }

  return [];
}
```

**先查找、后存入**很重要。这样不会用同一个下标两次，也可以正确处理 `[3, 3]` 这样的重复元素。

## 复杂度分析

在哈希表查询和插入平均 O(1) 的常用分析假设下，时间复杂度为 O(n)，额外空间复杂度为 O(n)。JavaScript 的 Map 规范并不承诺每一次操作都是严格 O(1)。

## 自测与追问

1. 只有一个元素时，返回什么？
2. 数组包含负数或重复值时，逻辑是否仍然正确？
3. 如果数组已经有序，能否使用双指针减少额外空间？
4. 如果需要返回所有数值组合，如何去重？
