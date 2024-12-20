---
title: "Monoid Algebraic structure"
pubDate: 2023-01-29
description: "介紹 Monoid 數學定義與程式的關係"
tags: ["Typescript", "Functional Programming", "fp-ts", "algebra"]
---

**Monoid**，是在一個 **Semigroup** 中存在一個 [identity element](https://en.wikipedia.org/wiki/Identity_element)。

### identity element

假設我們有個集合 $S$，而一個 **identity element** 必須滿足以下條件：

$$\exists e\in S, \forall a\in S\ \  a \bullet e = a\ \rm{and} \ e\bullet a=a$$

白話文解釋就是，在 $S$ 中存在一個 $e$，使得對於所有 $S$ 中的每個元素 $a$，等式 $a \bullet e = a$ 與 $e\bullet a=a$ 兩者成立。

實際案例就是相加跟相乘，相加的 identity element 是 $0$，相乘則是 $1$。

$$0 + 47 = 47\ and\ 47 + 0 =47$$

$$1 * 34 = 34\ and\ 34 * 1 =47$$

### Monoid

到目前為止我們已經整理了三樣規則

- Magma：嘗試定義一個集合 $M$ 的**二元運算**，$(M,\bullet)$

$$a,b\in M \Longrightarrow a \bullet b \in M$$

- Semigroup：以 Magma 為基礎添加一條結合律的規則，$(S,\bullet)$

$$x,y,z\in S\Longrightarrow(x\bullet y)\bullet z = x\bullet (y\bullet z)$$

- Monoid：從 Semigroup 集合 $S$ 中尋找是否存在 identity element，$(M,\bullet)$

$$\exists e\in M, \forall a\in M\ \  a \bullet e = a\ \rm{and} \ e\bullet a=a$$

[fp-ts interface](https://github.com/gcanti/fp-ts/blob/master/src/Monoid.ts#L50) 定義如下

```typescript
interface Monoid<A> extends Semigroup<A> {
  readonly empty: A
}
```

### 實例

我們依然可以定義一個數字加法

```typescript
import { Monoid } from 'fp-ts/Monoid';

const MagmaAdd: Monoid<number> = {
    concat: (first, second) => first + second,
    empty: 0,
};
```

我們再度把 `Coord` 例子拿出來，思考一下在這個結構跟運算是否存在一個 identity element

```typescript
type Coord = {
    x:number;
    y:number;
}

const MagmaCoordAdd: Monoid<Coord> = {
    concat: (first, second) => ({ x: first.x + second.x, y: first.y + second.y }),
    empty: // identity element ?
};
```

這裡有一個關鍵特徵，就是 `x` 跟 `y` 都同為加法運算，並且我們已經知道加法的 identity element 為 0，這時我們可以大概認定兩個 **Monoid** 的組合還會是一個 **Monoid** (實際還是要經過驗證才能證明這件事)，這時我們可以把 `Coord` 的 identity element 補上：

```typescript
type Coord = {
    x:number;
    y:number;
}

const MagmaCoordAdd: Monoid<Coord> = {
    concat: (first, second) => ({ x: first.x + second.x, y: first.y + second.y }),
    empty: { x: 0, y: 0 }
};
```

而另一個有趣的例子是某種[函式](https://github.com/enricopolanski/functional-programming#modeling-composition-through-monoids)的也能成為 Monoid

```typescript
import { flow, identity } from 'fp-ts/function';
import { Endomorphism } from 'fp-ts/Endomorphism';

export const getEndomorphismMonoid = <A>(): Monoid<Endomorphism<A>> => ({
    concat: flow,
    empty: identity,
});
```

### 參考連結

- https://github.com/enricopolanski/functional-programming#modeling-composition-through-monoids
- https://en.wikipedia.org/wiki/Monoid
- https://en.wikipedia.org/wiki/Identity_element
