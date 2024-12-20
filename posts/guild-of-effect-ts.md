---
title: "Effect-ts 概覽"
pubDate: 2023-10-10
description: "Effect-ts 生態與使用心得"
tags: ["Typescript", "Functional Programming"]
---

約莫年初時我已經接觸 fp-ts 一段時間，那時我發現作者專注在 v3 版本，而 v3 比較特別的是部份東西被拆散出來成各個 project，剛好作者在 discord 徵求協助寫文件跟範例，於是我就為 **fp-ts/data** 函數貢獻了一點範例跟測試案例。

當然故事還沒結束，當我發第二次 PR 時，作者請我將 PR 轉到 [Effect/data](https://github.com/Effect-TS/data) ，這時我才發現，原來 v3 是為了整個 **Effect-ts** 生態系準備的，而且整個生態系包含了各種 FP 風格實用的工具。

這次剛好找了一個機會將我的 discord 機器人全部用 Effect-ts 改寫（原先是 fp-ts），藉此來了解一下 Effect-ts 與 fp-ts 不同之處。

## Effect-ts 生態系

Effect-ts 本身並不是一大包的函式庫，而是有各種不同用途的函式庫組在一起，我挑幾個最核心最常用的出來。

- [effect](https://github.com/Effect-TS/effect)
  - 基於 Fiber 模型處裡非同步任務的 runtime
  - 將 fp-ts 本身非同步部份 (`Task`) 拔除只留基本的資料結構的函式庫，也有做一些優化(型別、函式等等)
- [@effect/match](https://github.com/effect-ts/match)\
   就是 pattern matching，懂得都懂 🙃
- [@effect/schema](https://github.com/Effect-TS/schema)\
    資料結構建模、驗證，跟 zod、yup 相似

### 我用了 Effect-ts 生態系的哪部份 ?

雖然我把整包都抓下來用，但如你所見，各部份是可以單獨被拿來使用的，所以依需求引用即可，而我這次實際用上的只有 **effect**。

## 重構的挑戰

然而還是會遇到一些問題跟挑戰，在 fp-ts 版本因為本身不干涉原本的非同步機制，相對來說在撰寫上比較自由，而 **effect** 本身有一個自製的 runtime 來調度你的非同步函式，所以在某些地方會有些不方便。

以下是我認為在重構中處理起來有點麻煩的部份：

### discordjs

因為是 discord 機器人，所以程式主軸會是 **discordjs** 這個函式庫，大部分都是將 `Effect` 與discordjs 作對接，然而這就是我遇到的一個挑戰。

由於 discordjs 本身是物件導向風格寫成的，我花了大部分的時間封裝 discordjs 函式以利於我用 `Effect` 組合

### Share State

在 fp-ts 中沒有提供共享狀態的方法或機制，所以我用 `IO` 跟 `Ref` 自己手動兜了一個出來，然後用傳遞的方式帶下去。而 effect 提供一個 `Context` 機制讓我們去使用，雖然方便但要理解他的機制需要一些時間，而共享狀態又分**可變**跟**不可變**，兩者作法又稍微不同，還有怎麼跟 `Effect` 配合。

- [Context / Managing Service](https://www.effect.website/docs/context-management/services)

- [Ref / Ref as a Service](https://www.effect.website/docs/state-management/ref#using-ref-as-a-service)

## Effect-ts 與 fp-ts 的區別

fp-ts 比較像 lodash, ramda 那種 library，單獨使用並不會對整體程式風格造成劇烈影響，因為你可以在 function 內用 fp-ts 的風格撰寫最後轉成一般形式再回傳，而 Effect-ts 不一樣，他擁有自己獨特的機制，雖然你也同樣的可以最後再轉一般形式，但相對的學習成本會比 fp-ts 還高上許多，也或許沒那麼值得。

我上面說的就是 `Task` 跟 `Effect` 這兩個背後原理跟複雜度差異是巨大的，`Task` 只是一個 `Promise` 的包裝相對好理解，而 `Effect` 背後是一整套任務調度機制，在除錯上可能會遇到困難。

另外，Effect-ts 跟 fp-ts 都擁有基礎的 `String`, `Number`, `Struct`, `Map`, `Set` 等等資料結構提供你使用，但我認為 Effect-ts 較為豐富而且更易於上手，畢竟是 fp-ts 演化而來，勢必他們趁這個機會做了許多優化改善，而且 Effect-ts 擁有一份非常詳細的[官方文件](https://www.effect.website)，而不是像 fp-ts 那樣只有 API doc 而已，裡面不只講解了 API 該怎麼使用，也隱含了一些 FP 概念在裡面。

### Effect 與 fp-ts 比較

<https://www.effect.website/docs/fp-ts>

## `Effect` 的奇特之處

講了這麼多終於要有 code 看看我在過程中發現有哪些神奇的部分，以下是我認為最有趣也最神奇的部分。

### Context type 消除機制

`Effect` 本身主要包含三個泛型參數 `Effect<Requirements, Error, Value>` ，`Error`, `Value` 很好懂，而 `Requirements` 才是特別的地方，假設有一個 function 內引用了 Context 相關的值，function 回傳 Effect `Requirements` 型別上會多掛上 Context 的型別。

這裡示範一個引用 Context 的函數，而我們來觀察這個函數回傳的 **Requirements** 型別上會是 `number` (`NumberService` 所存放的型別)。

```typescript
import { Context, Effect, identity, pipe } from 'effect'

const NumberService = Context.Tag<number>();

const getNumber = NumberService.pipe(Effect.map(identity));

// () => Effect<number, never, number>
const foo = () => getNumber
```

到此還沒結束，真正有趣的是執行的時候。今天一個 foo 這個函數執行時並不是真的執行，而是產生一個 Effect `program`，你必須再將這個 `program` 用 `Effect.runSync`, `Effect.runPromise` 等函數幫你執行。

```typescript
const program = foo()

Effect.runSync(program);
```

這時你會發現 Typescript 會發出型別錯誤提示，`Effect.runSync` 要求帶入的是 `Effect<never, never, number>`，而 `program` 是 `Effect<number, never, number>`，這是因為 `program` 取用了 `NumberService` 的值，但我們實際上還沒有提供 `program` `NumberService` Context 是什麼。

所以現在要提供實際的值給 `program` ：

```typescript
const program = foo().pipe(
  Effect.provideService(NumberService, NumberService.of(1))
  );

Effect.runSync(program);
```

然後錯誤就神奇的消失了，你的 `program` 型別會變成 `Effect<never, never, number>`。

這某種程度上防止開發者忘記帶入共享狀態的值，在使用上也不用自己特別標注 `Requirements`，只要你有使用，`Effect` 會自動幫你推導出來，甚至可以同時有多個存在。

### Option, Either 自動切換成 Effect 

在我們一般認知中，`flatMap` 函式只能與自己相同型別函數作串連，如 Option, Either

$$
M\ a \to (a \to M\ b) \to M\ b
$$

```typescript
const result = pipe(Option.some(20), Option.flatMap((n) => Option.some(n * 2)))
```

而 `Effect` 的 `flatMap` 是允許帶入 `(a : A) ⇒ Option<B>` 跟 `(a : A) ⇒ Either<E, B>` 函式的，**Either** 的 `Left`, `Right` 與 **Effect** 的 `Error`, `Value` 對應，而 **Option** 的 `none` 在 **Effect** 會被轉成 `NoSuchElementException`。

這樣帶來的好處是對於以前就有使用 `Option` 或 `Either` 的程式，不需要修改成 `Effect`，只需要把 `Option` 跟 `Either` 的來源換成 effect（我相信同個概念的東西 API 不會差太多），在轉換成本上減輕許多。

## Effect-ts 面臨的挑戰

Effect-ts 會面臨到如何與現有大部分函式庫相容，畢竟函數式程式設計在 JS/TS 的推廣及使用上我認為還在初期階段，雖然我前面提到你可以將 `Effect` 與現有主程式隔離處理，但從專案角度來看，這種作法似乎不是那麼值得使用，而另一個可能的方案就是越來越多的函式庫開始基於 Effect-ts 作設計，建立一個健全的生態系，但這肯定有很長一段路要走。

## 值得關注與應用的部份

其實撇除 `Effect` 本身，只使用一般資料結構的部分其實算是很好用的，在重構過程中我有想再用 lodash, ramda 等工具，但後來發現完全不用，而且大部分函數可以同時擁有 data first, data last 的特性，根據你呼叫函式方式不同，他會自動轉換方式，而這都歸功於 [dual](https://effect-ts.github.io/effect/modules/Function.ts.html#dual) 函數。

```typescript
const arr: Array<number> = [1, 2, 3];

const dataFirst = ReadonlyArray.map(arr, (n) => n * 2);

const dataLast = ReadonlyArray.map<number, number>((n) => n * 2)(arr);
```

至於原始碼的部分看讀者有沒有興趣讀，我自己貢獻過所以有讀一些 (Option, Either 等函式)，我認為寫的很嚴謹，至少型別是有整理好寫清楚的，會看到不少高階抽象的型別。

## 結語

Effect-ts 的出現對於 FP 推廣算是跨出了一大步，不過他們並沒有完全的限制你只能用聲明式方式寫程式，從而改用聲明式為**主**命令式為**輔**的形式，目的是為了拉近一般工程師與 Functional Programming 的距離，讓使用者感受 FP 思維帶來的價值。

不只是 Effect-ts 本身，fp-ts 作者也想推廣 FP，所以他選擇用 Typescript 製作 fp-ts，而不是 Rescript, Purescript 這類相對較冷門的語言。

fp-ts 作者在社群中有一段話我非常喜歡

> And yet, it's also the reason why TypeScript is so widely used, so you can't separate the two things, popularity and "bad things." That's why I chose TypeScript as a means to do my part and push functional programming a bit closer to mainstream, if I want to have any hope of conveying the value of functional programming to a wider audience, TypeScript is the bitter pill that I have to swallow

### 額外補充

在官網中會看到大部分範例會有兩種作法，一種是一般 pipeline 手法，而另一種使用 gen (generator function) 函式，gen 算是 Effect-ts 提供開發者使用命令式風格撰寫函式的一個解決方案。
