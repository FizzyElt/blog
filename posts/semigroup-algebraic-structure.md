---
title: "Semigroup Algebraic structure"
pubDate: 2023-01-15
description: "介紹 Semigroup 數學定義與程式的關係"
tags: ["Typescript", "Functional Programming", "fp-ts", "algebra"]
---

**Semigroup**，為代數結構的一種，也是 **Magma** 的延伸，從 **Magma** 添加一條[**結合律(Associative Property)**](https://zh.wikipedia.org/zh-tw/%E7%BB%93%E5%90%88%E5%BE%8B) 的規則。

### 結合律

首先我們定義一個 Magma 為 $(M,\ \bullet)$，從 $M$ 隨機取出三個元素(可以超過三個) $x,\ y,\ z$，將其作運算，而運算的優先度有以下幾種變化：

1. $((x\bullet y)\bullet z)$
2. $(x\bullet (y\bullet z))$
3. $x\bullet y\bullet z$

$x\bullet y\bullet z$ 這個 case 看起來是合理的，但在 Magma 中的定義的是[**二元運算(Binary operation)**](https://en.wikipedia.org/wiki/Binary_operation)，所以不會討論這個 case。

而結合律必須滿足
$$((x\bullet y)\bullet z) = (x\bullet (y\bullet z))$$
也就是說**不管元素有多少，執行計算優先度如何換，最終都不影響結果**，最常見的就是加法跟乘法：

$$((1+2)+3) = (1+(2+3)) = 6$$

$$((1*2)*3) = (1*(2*3)) = 6$$

在 [***fp-ts*** interface](https://github.com/gcanti/fp-ts/blob/master/src/Semigroup.ts#L57) 為

```typescript
interface Semigroup<A> extends Magma<A> {}
```

竟然就是 **Magma**！為什麼呢？
因為以型別來說 TS 無法知道你的運算（concat）到底有沒有遵守**結合律**，這是我們自己要去證明或確定的，以這裡來說只是給我們使用時識別這個 type 運算時需不需要遵守結合律。

我們用先前 **Coord Magma** 的例子來看有沒有遵守結合律：

```typescript
type Coord = {
  x: number;
  y: number;
};

const MagmaCoordAdd: Magma<Coord> = {
  concat: (first, second) => ({ x: first.x + second.x, y: first.y + second.y }),
};

const coordA: Coord = { x: 2, y: 5 };
const coordB: Coord = { x: 4, y: 8 };
const coordC: Coord = { x: 1, y: 7 };

// ((a + b) + c)
const res1 = MagmaCoordAdd.concat(MagmaCoordAdd.concat(coordA, coordB), coordC);
// (a + (b + c))
const res2 = MagmaCoordAdd.concat(coordA, MagmaCoordAdd.concat(coordB, coordC));

res1 === res2 // true
```

自己嘗試過後是有的，所以我們可以說 type **Coord** 相加是一個 **Semigroup**。

### 其他案例

還有些在程式裡擁有 **Semigroup** 特性的 **Magma**，像是**字串相加、&&、||**。

```typescript
('a' + 'b') + 'c' === 'a' + ('b' + 'c')
(true && false) && true === true && (false && true)
(true || false) || false === true || (false || false)
```

而在這篇[文章](https://github.com/enricopolanski/functional-programming#definition-of-a-semigroup)中提了兩個有趣的案例，可以自己實驗看看

```typescript
import { Semigroup } from 'fp-ts/Semigroup'

/** Always return the first argument */
const first = <A>(): Semigroup<A> => ({
  concat: (first, _second) => first
})
```

```typescript
import { Semigroup } from 'fp-ts/Semigroup'

/** Always return the second argument */
const last = <A>(): Semigroup<A> => ({
  concat: (_first, second) => second
})
```

### 參考資訊

- https://github.com/enricopolanski/functional-programming#definition-of-a-semigroup
- https://en.wikipedia.org/wiki/Semigroup
- https://en.wikipedia.org/wiki/Binary_operation
- https://en.wikipedia.org/wiki/Associative_property
