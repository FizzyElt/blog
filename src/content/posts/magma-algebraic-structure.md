---
title: "Magma Algebraic structure"
pubDate: 2023-01-15
description: "介紹 Magma 數學定義與程式的關係"
tags: ["Typescript", "Functional Programming", "fp-ts", "algebra"]
---

**Magma** 為代數結構的一種，擁有最單純定義，卻是其他代數結構的基礎。

## 定義
 
有一個集合與運算 $(M,\bullet)$，隨意取出 $M$ 中兩個元素 $a$ 和 $b$，將兩者做運算的結果仍為集合 $M$ 內的元素。

$$a,b\in M \Longrightarrow a \bullet b \in M$$

而在 ***fp-ts*** 的 [interface](https://github.com/gcanti/fp-ts/blob/master/src/Magma.ts#L20) 是這樣定義的

```typescript
interface Magma<A> {
    readonly concat(first: A, second: A) => A
}
```

這裡的 **A** 就是你要給的集合 $M$，**concat** 就是你要定義的運算 $\bullet$。

## 實例

假設我要定義數字的相加的 **Magma**，會寫成這樣：

```typescript
const MagmaAdd: Magma<number> = {
  concat: (first, second) => first + second,
};
```

加法太好聯想的，來點不一樣的，座標相加：

```typescript
type Coord = {
  x: number;
  y: number;
};

const MagmaCoordAdd: Magma<Coord> = {
  concat: (first, second) => ({ x: first.x + second.x, y: first.y + second.y }),
};
```

### 結合律？交換律？

這是我們要注意的點，**Magma** 本身並沒有要求你要達成**結合律**跟**交換律**特性，只是我們用的加法剛好有而已，所以我們只要達成定義上 $a,b\in M \Longrightarrow a \bullet b \in M$ 的條件，即可成為 Magma

### 參考資訊

- https://github.com/enricopolanski/functional-programming#definition-of-a-magma
- https://en.wikipedia.org/wiki/Magma_(algebra)#Category_of_magmas
