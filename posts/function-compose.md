---
title: "關於 FP 的函數組合"
pubDate: 2024-12-24
description: "利於函數組合的手法"
tags: ["Functional Programming"]
---

## 函數組合

一般情況下，我們想製作一個新函數，並且這個函數引用了其他函數我們都會用以下方法來實做

我們模擬一個過濾陣列內所有空值的函數

```javascript
const filterEmpty = (arr) => {
    return filter(arr, (value) => !!value)
}
```

但這個範例比較簡單，我們實做一個將 16 位卡號的字串每 4 位中間加上 dash 的函數

步驟是
1. 將字串切成字元陣列
2. 將字元陣列每四個分成一組
3. 將四個字元的陣列合併成字串
4. 最後將他們用 dash 串連在一起

```typescript
import { chunk, split, join, map } from "lodash";

const formatCard = (card: string) => {
    const chars = split(card, "");
    const parts = chunk(chars, 4);
    const formatted = map(parts, (part) => join(part, ""));
    return join(formatted, "-");
};
```

這帶來的問題是，我們需要一直暫存一個變數來接續下一個動作，然後還有命名的困擾，因為從步驟的說明來看你根本不在乎給每個步驟回來的結果應該叫什麼，你當然可以用嵌套的方式解決這個問題。

```typescript
import { chunk, split, join, map } from "lodash";

const formatCard = (card: string) => {
    return join(
        map(chunk(split(card, ""), 4), (part) => join(part, "")),
        "-",
    );
};
```

雖然解決一直要想命名的問題，但可讀性卻降低了。

### 組合函數

https://zh.wikipedia.org/wiki/%E5%A4%8D%E5%90%88%E5%87%BD%E6%95%B0

我們可以使用 `flow`, `compose`, `pipe` 等等函數來幫助我們用串連的方式組合函數，使可讀性變更高，這裡的 `pipe` 是使用 fp-ts 的

```typescript
const formatCardCompose = flow(
    (card: string) => split(card, ""),
    (chars: string[]) => chunk(chars, 4),
    (charOfParts: string[][]) => map(charOfParts, (part) => join(part, "")),
    (parts: string[]) => join(parts, "-"),
);

// 或是
const formatCardCompose = (card: string) =>
    pipe(
        card,
        (card: string) => split(card, ""),
        (chars: string[]) => chunk(chars, 4),
        (charOfParts: string[][]) => map(charOfParts, (part) => join(part, "")),
        (parts: string[]) => join(parts, "-"),
    );
```

然後可以利用這個方式迴避掉重複命名的困擾

```typescript
const formatCardCompose = flow(
    (value: string) => split(value, ""),
    (value: string[]) => chunk(value, 4),
    (value: string[][]) => map(value, (part) => join(part, "")),
    (value: string[]) => join(value, "-"),
);

// 或是
const formatCardCompose = (card: string) =>
    pipe(
        card,
        (value: string) => split(value, ""),
        (value: string[]) => chunk(value, 4),
        (value: string[][]) => map(value, (part) => join(part, "")),
        (value: string[]) => join(value, "-"),
    );
```

雖然串連方式可讀性變高了，但相比於最一開始的範例，你除了命名之外似乎沒省多少工，而且每個函數都參數命名有寫跟沒寫一樣，感覺非常冗餘

## 讓組合變容易的兩個函數設計操作 data last/currying

想要讓函數串接更簡潔容易，需要在函數設計上動一點手腳，一個是 data last 一個是 currying，兩者缺一不可

### Data last

將主要被操作的參數擺到最後，例如 `map` 函數的型別可能是

```typescript
type MapArr = <T, R>(arr: T[], fn: (item: T) => R) => R[];
```

換成 data last 形式

```typescript
type MapArr = <T, R>(fn: (item: T) => R, arr: T[]) => R[];
```

但這樣有解決問題嘛？我們將上面的函數再組合看看

```typescript
const formatCardCompose = flow(
    (str: string) => split("", str),
    (chars: string[]) => chunk(4, chars),
    (charOfParts: string[][]) => map((part) => join("", part), charOfParts),
    (parts: string[]) => join("-", parts),
);
```

似乎啥也沒解決，只是參數丟的位置被調換了。

## Currying

柯理化就是將你的函數參數傳遞變成階段性的，原本執行時一定要全部帶完，柯理化後你可以只做一半(Partial Application)！！

```typescript
// normal
const normal = (A, B, C) => D
normal(a, b, c);

// currying
const currying = A => B => C => D
// B => C => D
const rest = currying(a)
// C => D
const restB = rest(b)
// result D
const result = restB(c)

// 只先帶兩個，你會得到 C => D
const fn = currying(a)(b)

// 全部帶完拿結果 D
const result = currying(a)(b)(c)
```

原本我們在每個步驟做函數型別的要求假設是 `A => C` 而你的函數是 `(A, B) => C` ，B 是你已知並且要帶的參數，而你被要求兩個參數要同時放才能得到結果，所以我們一直在做包裝的動作好讓我們把 A 跟 B 一起放進去

```
A => ((A, B) => C)(A, B)
```

以 `chunk` 為例，假設我想得到一個 `A => C` 的函數，但是 `chunk` 本身是個 `(A, B) => C` 函數，唯一先給 `B` 得到`A => C` 的方法就是重新封裝

```typescript
const chunkOfFour = (arr) => chunk(arr, 4)
```

但是重新封裝這件事讓我又回到一開始的命名問題，你得為這個函數想個名字，然後大部分這個函數其實一點都不通用，所以之前的範例會變成

```typescript
const strToChars = (str: string) => split(str, "")

const chunkOfFour = <T>(arr: T[]) => chunk(arr, 4)

const groupOfChunks = (charOfParts: string[][]) => map(charOfParts, (part) => join(part, ""))

const joinWithDash = (arr: string[]) => join(arr, "-")

const formatCardCompose = flow(
    strToChars,
    chunkOfFour,
    groupOfChunks,
    joinWithDash,
);
```

即便對函數柯理化依然沒辦法擺脫重複包裝的命運，因為第一個參數要求的是資料本身

```typescript
const strToChars = (str: string) => split(str)("")

const chunkOfFour = <T>(arr: T[]) => chunk(arr)(4)

const groupOfChunks = (charOfParts: string[][]) => map(charOfParts)((part) => join(part)(""))

const joinWithDash = (arr: string[]) => join(arr)("-")

const formatCardCompose = flow(
    strToChars,
    chunkOfFour,
    groupOfChunks,
    joinWithDash,
);
```

### 將兩者結合

如果將函數做 data last 跟 currying 的操作，你會得到這個函數 `B => A => C`，剛剛有提到柯理化的函數可以不用把參數一次給完，我可以只給 `B` 就直接得到 `A => C` 不需要任何包裝

因此剛剛的組合函數可以變成這樣

```typescript
import { split, chunk, map, join } from 'lodash/fp';

const formatCardComposeFp = flow(
    split(""),
    chunk(4),
    map(join("")),
    join("-"),
);
```

除了利於做組合之外，因為可以只帶一部分參數生成另一個函數，這樣這個函數本身可以非常容易生成更多衍生函數出來

```typescript
import { reduce } from 'lodash/fp'

const sum = reduce<number, number>((acc, x) => acc + x, 0);

const mul = reduce<number, number>((acc, x) => acc * x, 1);

const reverse = reduce((acc, x) => {
    acc.unshift(x);
    return acc;
}, []);
```

https://fizzyelt.github.io/functional-programming/fp-0002.xml
## 使用場景？

FP 以純函數與組合為核心出發，以上是將組合這件事變得容易的手段之一，如果在做組合這件事 FP 的函數是可以發揮的很好，但在一般情況下他會顯的不那麼直覺。

### 我全部的好處都要拿

我不僅想在一般情況下寫得很命令式，在組合的情況下也能用聲明式來寫，做的到嘛

答案是可以的，在 lodash/fp 你可以一次帶完全部的參數拿到結果，也能只丟一部分取得新函數，拿 `split` 當案例

```typescript
// ["1", "2", "3"]
const res = split("", "123")

// ["1", "2", "3"]
const res2 = split("")("123")
```

但是它依然走 data last 形式

有些 FP 函式庫有對這個東西做特別處裡，讓 DX 更好，這裡以 Effect-ts `chunkOf` 為例

```typescript
import { Array } from 'effect'
// data first [[1, 2], [3, 4], [5, 6]]
const res = Array.chunksOf([1, 2, 3, 4, 5, 6], 2);

// data last [[1, 2], [3, 4], [5, 6]]
const res = Array.chunksOf(2)([1, 2, 3, 4, 5, 6]);
```

這歸功於 [dual](https://effect.website/docs/code-style/dual/) 函數輔助

但這就以 lib 開發者本身作為考量，由於 lodash 本身就不以 FP 為出發，所以對這方面沒有特別著墨

## 思考方式

FP 的函數設計的思考方式更傾向於先聲明意圖再決定資料可以丟什麼

而一般的情況下都是先得到資訊再決定要對資料做什麼
