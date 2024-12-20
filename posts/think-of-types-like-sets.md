---
title: "用集合思考型別"
pubDate: 2023-04-16
description: "透過集合的概念來思考程式的型別"
tags: ["Functional Programming", "algebra", "set"]
---

作為一個 FP 愛好者，當你學習到某種程度時你多多少少會碰點數學，即便沒有直接接觸數學本身也會了解一下 FP 語言，**Haskell** 肯定聽過吧？

但單純的學寫語言已經滿足不了你了，你想好好探究一下數學對 FP 的奧妙之處，而你第一個聽到的就是**範疇論(category theory)，**你滿心期待的想了解這一切的起源了，不過脫離數學太久的你似乎無法應付，況且這領域還是極度抽象的。你卡關了，你到處找影片、找文章，試圖理解這到處都是**圓圈**、**圓點**、**符號**跟**箭頭**的東西到底是什麼？

## 失敗了

你努力過最後還是失敗，雖然許多教學都幫你把程式跟範疇論的一些事物做對應，腦中還是滿滿疑惑，似懂非懂。

對於試圖做過努力得你肯定也看過 [fantasy-land](https://github.com/fantasyland/fantasy-land) 的這張圖：

![algebra](https://i.imgur.com/fbrWU8p.png)

我也相信你應該沒耐心把內容全部看完（就是我），並且焦點全在左側的 `Functor` 樹狀圖（還是我），以為這才是你最需要學習的，不過在因緣際會之下讀了 **fp-ts** 作者的 FP 介紹[文章](https://github.com/enricopolanski/functional-programming)才發現我似乎在越級打怪。

## Algebraic Structure

我相信你或多或少也在 wiki 搜尋到或見過這張圖：

![](https://i.imgur.com/wpmbJRm.png)

你可能也覺得這應該不是我需要的，所以就略過了（又是我），但 **fp-ts** 作者的文章就是從這裡開始說起，而你再仔細看一下整張圖最源頭 「**Magma**」的數學[定義](https://en.wikipedia.org/wiki/Magma_\(algebra\))，是由一個 **集合(set)** 跟一個 **運算(operation)** 組成。這太棒了，我們似乎找出了一些蛛絲馬跡，那這裡的**集合**到底代表什麼呢？

## 集合 Set

說到集合，我們必須來複習一下定義

> 集合是一種把若干個元素放在一起的方式，不考慮元素的**順序**和**重複性**。集合可以用大括號 $\{\}$ 來表示，例如 $\{1,2,3\}$ 是一個集合，包含了三個元素 1, 2 和 3。集合的定義是抽象的，可以用來描述**任何事物的分類或歸納**。

### 我們平常看待的型別

以往學習程式語言，型別通常對開發者是一種標記，好讓讀的人知道這是什麼，當然以計算機的角度會是不同意義，所以我們這裡只討論開發者的感受。

首先我們從 TS 常見的 *primitive type* 講起，最常見的有三個，`boolean` 、`number` 、 `string`

* **boolean** : 只有 `true` 、`false` 兩種狀況

* **number** : 包含正負整數、浮點數(有最大值跟最小值，但在這我們先不考慮)

* **string** : 字元的集合，在不限制字數情況下是無限多種組合

或是利用 *primitive type* 組成的**複合型別**

```ts
type Coord = {
  x: number;
  y: number;
}
```

這些在日常開發上有做到提醒的作用，避免掉一些 bug，但除了 bug 之外我還在意一件事，那就是「**該型別到底涵蓋多少 elements ?**」。

### 帶入集合的概念

假如我們把 `boolean` 視為一個集合，那它擁有多少元素呢？

當然會是兩個，因為只有 `true` 跟 `false` 兩種，所以 `boolean` 這個型別是寫成以下這樣：

```ts
type Boolean = true | false;
```

&nbsp;

我們依此類推，`number` 這個集合會有幾個元素？

我們有正負整數跟浮點數，有個最大值最小值，所以 `number` 這個型別實際上是寫成：

```ts
type Number = Min_Number ... 0 | 1 | 2 ... Max_Number
```
實在是好多我寫不完

`string` 也是同理而且跟 `number` 很像，元素也非常多：

```ts
type String = '' | 'a' | 'b' | ... | 'ab' | ...
```

如果今天是元素量是有限的，並且量不多的話寫 *union type* 的形式當然是最好，這樣更能精確表達該型別一定會出現什麼，不可能出現什麼，像是一年只有 12 個月或是一星期只有 7 天

```ts
type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
```

那如果今天我要一個**偶數**的型別 `EvenNumber` 呢？元素很多，我們不可能一一寫出，並且你沒法在靜態檢查時檢查出來，唯一的辦法是寫一個 `function` 來限制它，這裡我們利用 `Option` 來表示，如果是 `Some` 那就是偶數，是 `None` 就不是偶數：

```ts
function evenNumber(n: number): Option<number>{
  if(Number.isInteger(n) && n % 2 === 0) return some(n);
  return none()
}
```

`function` 在程式裡過濾資料是非常常見的，就像是資料驗證就是從眾多可能元素過濾出我們需要的，而這個結果會是輸入**資料集合**裡的一個**子集合。**

![Set](https://i.imgur.com/T3OZ1WQ.png)

而這個 `function` 扮演的似乎就是我們 **Magma operation(運算)** 的一個角色。

### 複合型別

複合型別就是將各種 type 組合成一個新的 type，而複合型別這個集合的元素就是所有這些屬性的組合：

```ts
type Person = {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'None'
}

const person: Person = {
  name: 'John',
  age: 20,
  gender: 'Male'
}
```

而 `person` 這個變數就是 `Person` 集合裡的一個元素。

## Sum Type 跟 Product Type

我們很常在 **ADT(Algebraic Data Type)** 聽到這兩個詞，似乎很重要的東西，但我們該怎麼識別它呢？

對於識別一個 type 是 **Sum Type** 還是 **Product Type** 網路上有很多方法，但對我而言都不夠明確，你能識別以下幾個 type 嘛 ?

```ts
type Color = [number, number, number]  // r, g, b

type Coord = {
  x: number;
  y: number;
}

type Diection = 'up' | 'down' | 'left' | 'right';


type Milk = {
  // ...
}

type Tea = {
  // ...
}

type Coffee = {
  // ...
}

type Drink = Milk | Tea | Coffee;
```

### 元素數量

我自己一個最簡單的方法是利用**計算元素數量**的方式來辨別

假設你想計算 `Color` 這個集合總共有幾個元素，那就會是先看 `number` 集合有幾個元素，我們假設 `number` 集合元素有 $n$ 個，而 `Color` type 是三個 `number` 的組合，所以元素的數量會是

$$
n \times n \times n
$$

那 `Drink` 呢？我們假設 `Milk`, `Tea`, `Coffee` 元素數量分別為 $m,t,c$ ，那 `Drink` 集合的元素數量會是

$$
m + t + c
$$

注意到符號不一樣了嘛，一個是 $+$ 一個是 $\times$ ，而加總跟乘積的英文正好就是 **sum** 跟 **product**

以後就可以利用計算元素數量的方式來辨別是個 **Sum Type** 還是 **Product Type**。

## 結語

透過將型別視為集合來思考，建立型別實際上就是在建立一個集合。而函數就像是對這些集合進行操作，因此進一步讓我深入了解了 Functional Programming 的思想。現在，型別對我們的作用已不僅僅是輔助識別或防止錯誤，使用集合的概念設計型別以及操作資料，可以讓程式更加清晰明確。