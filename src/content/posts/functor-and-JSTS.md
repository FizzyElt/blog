---
title: "Functor 與 JS/TS"
pubDate: 2022-09-01
description: "用數學角度出發去看 Functor 的定義什麼，我們怎麼用 Typescript 實現它，以及 Option、List 幫我們做了什麼。"
tags: ["Typescript", "Functional Programming"]
heroImage: "https://cdn.pixabay.com/photo/2022/01/03/06/08/mathematics-6911748_960_720.jpg"
---


用數學角度出發去看 **Functor** 的定義什麼，我們怎麼用 `Typescript` 實現它，以及 `Option`、`List` 幫我們做了什麼。

![](https://cdn.pixabay.com/photo/2022/01/03/06/08/mathematics-6911748_960_720.jpg)


## 定義
根據[維基百科](https://en.wikipedia.org/wiki/Functor)描述「Functor 是範疇之間的映射」，而且要視為 Functor 要達成幾項條件：

先假設有 $C$ 與 $D$ 兩個範疇，而 functor $F$ 是 $C$ 與 $D$ 之間的映射

- $C$ 範疇中的每個 object $X$ 都與 $D$ 之中每個 $F(X)$ 相關聯
- 將 $C$ 中的每個 morphism $f: X \to Y$ 關聯到 $D$ 中的 morphism $F(f): F(X) \to F(Y)$ 並且達成以下兩個條件：
    - 對於 $C$ 中的每個 $X$，$F(id_x)=id_{F(x)}$
    - 對於 $C$ 中的 $f:X \to Y$ 和 $g:Y \to Z$ 等所有 morphism ，$F(g\circ f)=F(g)\circ F(f)$

![functor 示意圖](https://i.imgur.com/VUGeZ7J.png)

其他關於 Functor 定義的參考連結
- [Functor and Natural Transformation](https://categorytheory.gitlab.io/functor_and_natural_transformation.html)
- [What is a Functor? Definition and Examples, Part 1](https://www.math3ma.com/blog/what-is-a-functor-part-1)

每篇文章對 Functor 定義可能有些許不同，但你能找出他們之間的共同點，而那個共通點就是 Functor 的公認定義。

### 建立一個 Functor
我們需要一個從範疇 $C$ 轉到範疇 $D$ 的 function，而範疇 $C$ 在程式中通常代表了所有原始型別與自定義型別之間的關係，範疇 $D$ 表示另一個空間與範疇 $C$ 互相對應。

先定義一個 Functor
```typescript
interface Functor<T>{
    value:T
}

// X -> F(X)
function of<T>(value:T): Functor<T> {
    return {
        value: value
    }    
}
```

`of` 就是將範疇 $C$ 的 object 帶到範疇 $D$ 的一個函式。


### map / fmap
但是當我們今天在範疇 $C$ 有個 morphism 是 $f:X\to Y$，那範疇 $D$ 也要有相應的 morphism，但總不可能 $C$ 有多少個 morphism，$D$ 也跟著建多少個 morphism，所以我們 $D$ 需要一個 `map` 函式將 $C$ 的 morphism 映射過去。

```typescript
interface Functor<T>{
    value:T
    map<U>:(fn: (v:T) => U): Functor<U>;
}

// X -> F(X)
function of<T>(value:T): Functor<T> {
    return {
        value: value
        map: (fn)=> of(fn(value))
    }    
}
```

我們來實際運行看看是否有達成 Functor 定義

$X\to F(X)$
```typescript
// X
const x: number = 10;
// F(X)
const fx: Functor<number> = of(x);
```

$f:X\to Y$ -> $F(f:X\to Y)$

```typescript
const f = (x: number): string => x.toString();

const fx: Functor<number> = of(10);

const fy: Functor<string> = fx.map(f);
```

$F(g\circ f)=F(g)\circ F(f)$
```typescript
const f = (x) => x * x; // number -> number
const g = (y) => y.toString(); // number -> string

const fx: Functor<number> = of(10);

const fz1: Functor<string> = fx.map((x) => g(f(x)));
const fz2: Functor<string> = fx.map(f).map(g);
```
`fz1` 跟 `fz2` 結果是相同的

### 建完了 Functor 然後呢？

我們做了一個 Functor，但是看不出來有什麼用。確實沒有什麼用，就只是把值帶入 $D$ 範疇裡而已，不過我們可以對 $D$ 動手腳，並且只要我們有達成條件，那就還是 Functor。

---

## 創造一個「有」跟「沒有」的世界
既然我們要看出 Functor 的實際效果，那我們需要加點魔法，我們在寫程式時常常需要判斷欄位或者值存不存在，確定存在才往下執行。

```typescript
function fn(value: number | undefined): numbner | undefined {
    if(value !== undefined){
        return value * 2 + 50;
    }
    
    return undefined;
}
```

看起來還好，不過當量多起來的時候你會變得很煩躁，每次都要檢查值存不存在，難道我不能只說我要怎麼算，是不是空的無所謂，空的就自動幫我跳過。

### Option / Maybe
**Option** 跟 **Maybe** 就是在解決這個問題，讓我們來實作一個 `Option`

```typescript
interface IOption<T> {
    map: <U>(fn: (value: T) => U) => Option<U>;    
}

class Some<T> implements IOption<T> {
    value: T;
    
    constructor(value: T) {
        this.value = value;
    }

    map<U>(fn: (value: T) => U): Some<U> {
        return new Some(fn(this.value))    
    }
}

class None implements IOption<undefined> {
    value: undefined;
    
    constructor(value?: any){
        this.value = undefined;
    }

    map<U>(fn: (value: any) => U): None {
        return this;
    }
}

type Option<T> = Some<T> | None;

function of<T>(value: T): Option<T>{
    if(value === undefined) return new None();
    return new Some(value);
}
```

上方只是個範例，實作方法以及 `null` 該不該認定為空值都取決於開發者本身。

那我們把原本的範例修改一下：

```typescript
function fn(value: Option<number>): Option<number>{
    return value.map((v) => v * 2 + 50);
}
```

而在傳進去之前將一個不確定是不是 `number` 的值用 `of` 轉成 `Option<number>`，一切一如往常，運算式照算並且不需要一直判斷，只有真正要用到這個值時你才要確認他到底存不存在。

所以我們在 `of` 跟 `map` 上做了一些調整，如果以單純 Type 來看，還是達成了 Functor 的條件

- $X\to F(X)$ 
```typescript
of = T -> Option<T>
```
- $f:X\to Y$ -> $F(f:X\to Y)$

```typescript
const f = (x: number): string => x.toString();

const optionX: Option<number> = of(10);

const optionY: Option<string> = optionX.map(f);
```
- $F(g\circ f)=F(g)\circ F(f)$
```typescript
const f = (x) => x * x; // number -> number
const g = (y) => y.toString(); // number -> string

const optionX: Option<number> = of(10);

const optionZ1: Option<string> = optionX.map((x) => g(f(x)));
const optionZ2: Option<string> = optionX.map(f).map(g);
```

`optionZ1` 與 `optionZ2` 結果會相同

非常神奇對吧，我們把判斷 **有** 跟 **沒有** 這件事隱藏起來了，而另一個常見的 Functor 都藏匿在我們日常開發中，那就是 **Array** / **List**。

---

## Array / List，把 for loop 隱藏起來
在日常開發中我們常需要對整個 Array 每個值作一些運算，所以最原始的方法都是用 for loop。
```typescript
function fn(arr: Array<number>): Array<string>{
    const newArr = [];

    for(num of arr){
        newArr.push(num.toString());
    }

    return newArr;
}
```

好像也還好，但是當今天你有更多樣化的需求時怎麼辦？可能是時間轉換、取物件裡某個欄位等等，那你可能每次都要重新寫一個 for loop function 處理這件事，非常的麻煩且無意義。

在 JS 中其實已經有 `map` method 讓你用了，那我們來看是否都達成了 Functor 的條件

- $X\to F(X)$ 
```typescript
const arr: Array<number> = Array.of(1); // 或任何其他創建 Array 的方式
```
- $f:X\to Y$ -> $F(f:X\to Y)$

```typescript
const f = (x: number): string => x.toString();

const arrX: Array<number> = Array.of(1, 2, 3);

const arrY: Array<string> = arrX.map(f);
```
- $F(g\circ f)=F(g)\circ F(f)$
```typescript
const f = (x) => x * x; // number -> number
const g = (y) => y.toString(); // number -> string

const arrX: Array<number> = of(1, 2, 3);

const arrZ1: Array<string> = arrX.map((x) => g(f(x)));
const arrZ2: Array<string> = arrX.map(f).map(g);
```
`arrZ1` 與 `arrZ2` 結果會相同

我們把枯燥乏味的 for loop 隱藏起來了！

## 結語
我們從數學上的定義與在 FP 語言中常出現的 Functor type 做了對應，以了解數學與程式之間如何配合，以及這些 Functor 解決了我們日常開發的哪些問題，甚至 `Either` 也可以自己試著了解並實作。