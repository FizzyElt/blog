---
title: "你以為 React Query 壞了，但其實沒有"
pubDate: 2024-06-27
description: "React Query 結構共享機制說明" 
tags: ["Front-End","React-Query"]
---


我們已經理解 react-query 在什麼狀態下會怎麼取資料，如第一次結果回來前(loading) data 會是 undefined，而第二次發出請求時 data 會暫時給你前一次 cache 的值，直到請求成功，如此循環。

在這個前提下你大概會預期 query status 的 data 會在什麼情況下會觸發改變，在假設 cache 都存在的情況下，同一個 useQuery 相同 queryKey 不斷 refetch 以下情況會改變

1. 第一次從 API 取到 data 時 `undefined -> data`
2. 第二次重新 refetch 成功後拿到新值 `oldData -> newData`
3. 第 N 次重新 refetch 成功後拿到新值 `oldData -> newData`

```tsx
function App() {
  const status = useQuery({
    queryKey: ["status"],
    queryFn: fetchData,
  });

  useEffect(() => {
      console.log("data change", status.data);
  }, [status.data]);
  
  return (<div>
      <button type="button" onClick={() => status.refetch()}>
        refetch
      </button>
  </div>);
}
```

再假設另一種情境，我有一個 flag 當作 key 切換，我重複的來回切換 status 的 data 會怎麼觸發更新，一樣，這次也假設 cache 都存在的情況

1. flag = `false` 情況下第一次從 API 取到 data 時 `undefined -> data(false)`
2. flag 由 `false` 轉成 `true` 時重發 API 等待時間 `data(false) -> undefined`
3. flag = `true` API 成功 `undefined -> data(true)`
4. flag 由 `true` 轉成 `false` 時重發 API 等待時間 `data(true) -> cache data(false)`
5. flag = `false` API 成功 `cache data(false) -> newData(false)`
6. flag 由 `false` 轉成 `true` 時重發 API 等待時間 `data(false) -> cache data(true)`
7. flag = `true` API 成功 `cache data(true) -> newData(true)`
8. 在 cache 未消失的情況一直切換都會是 4 ~ 7 的循環

```tsx
function App() {
  const [flag, setFlag] = useState(false);

  const status = useQuery({
    queryKey: ["status", flag],
    queryFn: fetchData,
  });

  useEffect(() => {
    console.log("data change", status.data, flag);
  }, [status.data]);

  return (
    <div>
      <button type="button" onClick={() => setFlag(!flag)}>
        click
      </button>
      <button type="button" onClick={() => status.refetch()}>
        refetch
      </button>
    </div>
  );
}
```

## 事情沒那麼簡單

當你真的實際去測我給的範例的時候，你會發現好像有些情況跟你認知不同，尤其是你自己做了一個模擬 API 的函數時

```typescript
const fetchData = () => {
  return Promise.resolve({ data: { name: "content" } });
};
```

第一個範例在 refetch 情況下會無法觸發更新，而第二個範例在每次切轉預期會有兩次但變成一次。

你以為你的預期是錯的嘛？不，前面所有預期是都對的，只是 react query 會對資料作[結構共享(structural sharing)](https://tanstack.com/query/latest/docs/framework/react/guides/render-optimizations#structural-sharing)，因為這個原因你的資料在某些情況下 `useEffect` 會偵測不到 data 的更新

## 結構共享

比對新舊資料將相異的資料更新，但相同的資料保留舊參考(Object, Array)，來舉幾個範例

結構相同但部份資訊不同
```typescript
const oldData = {
    name: 'john',
    age: 20
}

const newData = {
    name: 'john',
    age: 30
}
```

[![](https://mermaid.ink/img/pako:eNqFkMtqAzEMRX_FqJsWEsjai0LLrLNpd-MsVFvjMfEj-EEpIf9euZOGlAYiYyFfjqVrH0EnQyBh8ulTz5ireH9VUXBoj6UMNAmWoyUjSs1pT_JhM20WYsmlfdiMh1lkKs3XRexhXCZdXYqXlj2YGg1W3Ekpfzuv188iYqCxp90N9odASyPvq4sLSZGLvv64UZCysy4-Jm8G7vGk4J41Jq_G8Wl7w9M_6OVs62IGVhAoB3SG__XYZQV1pkAKJJcG8757OTGHraa3r6hB1txoBTk1O4Oc0Bc-tQMPosEhvyic1dM3mr2JdA?type=png)](https://mermaid.live/edit#pako:eNqFkMtqAzEMRX_FqJsWEsjai0LLrLNpd-MsVFvjMfEj-EEpIf9euZOGlAYiYyFfjqVrH0EnQyBh8ulTz5ireH9VUXBoj6UMNAmWoyUjSs1pT_JhM20WYsmlfdiMh1lkKs3XRexhXCZdXYqXlj2YGg1W3Ekpfzuv188iYqCxp90N9odASyPvq4sLSZGLvv64UZCysy4-Jm8G7vGk4J41Jq_G8Wl7w9M_6OVs62IGVhAoB3SG__XYZQV1pkAKJJcG8757OTGHraa3r6hB1txoBTk1O4Oc0Bc-tQMPosEhvyic1dM3mr2JdA)

綠框就是 oldData 與 newData 作結構共享後被異動的結構或值。

我們把結構弄複雜一點
```typescript
const oldData = {
    name: 'john',
    age: 20,
    arr: [1, 2],
    subObj: {
        data: "content"
    }
}

const newData = {
    name: 'john',
    age: 20,
    arr: [1, 2, 3],
    subObj: {
        data: "content"
    }
}
```

[![](https://mermaid.ink/img/pako:eNqFkstqwzAQRX_FqJsWEshai0KLl6WFpjs7i7E1lpXYUhhJlBLy7x1XcZNgN5VBj6szY3PwQdROoZCi6dxn3QKF7OW9tBmPugPvc2wyjq1GlflAbofybtWsEpFmHytNsG8zQh-7kMJhKENYB-Ns9vF8TpkqFATYSCnHzsvl45C_Qo-F5Wkzg4_Qk8YC9G2EqACiizfcgNexequ2hf9ZrrumqxHMuSqVJggttx2eKwmlcGS0sfeuU0PFQyn-M3Lecc3Fx_FpzsgEmhqZIicjN5C_PPxejeCMB7EQPVIPRvGfdBjiUoQWeyyF5K0C2g0ajsxBDG79ZWshA0VcCHJRt0I20Hk-xT03xtwAy-xP6fEbf4nTDg?type=png)](https://mermaid.live/edit#pako:eNqFkstqwzAQRX_FqJsWEshai0KLl6WFpjs7i7E1lpXYUhhJlBLy7x1XcZNgN5VBj6szY3PwQdROoZCi6dxn3QKF7OW9tBmPugPvc2wyjq1GlflAbofybtWsEpFmHytNsG8zQh-7kMJhKENYB-Ns9vF8TpkqFATYSCnHzsvl45C_Qo-F5Wkzg4_Qk8YC9G2EqACiizfcgNexequ2hf9ZrrumqxHMuSqVJggttx2eKwmlcGS0sfeuU0PFQyn-M3Lecc3Fx_FpzsgEmhqZIicjN5C_PPxejeCMB7EQPVIPRvGfdBjiUoQWeyyF5K0C2g0ajsxBDG79ZWshA0VcCHJRt0I20Hk-xT03xtwAy-xP6fEbf4nTDg)

這樣我們可以看出在部份資料修改時整個父層結構都會被更新，詳細可以看[replaceEqualDeep](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L244) 實作，或是參考[測試案例](https://github.com/TanStack/query/blob/09382a4b430f3decb933b56a124ccd4772f042d4/packages/query-core/src/__tests__/utils.test.tsx#L140)

到此，剛剛的疑惑可以解開了，因為我們 API data 一直沒變，結構共享後的參考也會維持，所以 `useEffect` 會偵測不到更新。

哪些更新因為結構共享被省略了？

第一個範例
1. 第一次從 API 取到 data 時 `undefined -> data`
2. ❌ 第二次重新 refetch 成功後拿到新值 `oldData -> newData`
3. ❌ 第 N 次重新 refetch 成功後拿到新值 `oldData -> newData`
第二個
1. flag = `false` 情況下第一次從 API 取到 data 時 `undefined -> data(false)`
2. flag 由 `false` 轉成 `true` 時重發 API 等待時間 `data(false) -> undefined`
3. flag = `true` API 成功 `undefined -> data(true)`
4. flag 由 `true` 轉成 `false` 時重發 API 等待時間 `data(true) -> cache data(false)`
5. ❌ flag = `false` API 成功 `cache data(false) -> newData(false)`
6. flag 由 `false` 轉成 `true` 時重發 API 等待時間 `data(false) -> cache data(true)`
7. ❌ flag = `true` API 成功 `cache data(true) -> newData(true)`
8. 在 cache 未消失的情況一直切換都會是 4 ~ 7 的循環


## 還是太天真了

今天在你的 useQuery 多了加了select 函數，情況又不一樣了，因為 react query 會自動再執行一次結構共享，只是時機點不同，所以一次的 data 更新總共會執行兩次，但在第一個範例你看不出差異，需要第二個範例才能察覺。

```tsx
function App() {
  const [flag, setFlag] = useState(false);

  const status = useQuery({
    queryKey: ["status", flag],
    queryFn: fetchData,
    select: (v) => v // 新增 select 函數
  });

  useEffect(() => {
    console.log("data change", status.data, flag);
  }, [status.data]);

  return (
    <div>
      <button type="button" onClick={() => setFlag(!flag)}>
        click
      </button>
      <button type="button" onClick={() => status.refetch()}>
        refetch
      </button>
    </div>
  );
}
```

在試著去切換你會發現有哪些更新被省略了
1. flag = `false` 情況下第一次從 API 取到 data 時 `undefined -> data(false)`
2. flag 由 `false` 轉成 `true` 時重發 API 等待時間 `data(false) -> undefined`
3. flag = `true` API 成功 `undefined -> data(true)`
4. ❌ flag 由 `true` 轉成 `false` 時重發 API 等待時間 `data(true) -> cache data(false)`
5. ❌ flag = `false` API 成功 `cache data(false) -> newData(false)`
6. ❌ flag 由 `false` 轉成 `true` 時重發 API 等待時間 `data(false) -> cache data(true)`
7. ❌ flag = `true` API 成功 `cache data(true) -> newData(true)`
8. 在 cache 未消失的情況一直切換都會是 4 ~ 7 的循環

### 兩次結構共享時機點

第一次的結構共享會是 react-core 裡的 `Query` fetch API 拿到值的當下會做一次去更新狀態，第二次會從我準備要更新狀態根據你有沒有放 select 再做一次，否則就是直接替換。

[![](https://mermaid.ink/img/pako:eNp1UL1uAjEMfpXIAxO8wA0M6HgC6EQY3MSQU3NJSBydKsTWpe_A0pdrX6M-jkpFVb3E_n5sx2cw0RI0cPBxMA4zq-1KByVR6vMxY3KqELfIOKFjxEC7TMmjofWpom-J0v6BVovFUtmuJGTjnpJFpomnYKfkkRT95_VdJnkyPHp5iP-N-OP8evv45by7Jq20UbMf6LZUoGH8zE5eJX5UhaXLHubQU-6xs3KL82jWwI560tBIajG_aNDhIjqsHDevwUDDudIccqxHB80BfZGq3rZqO5Tb9Xf08g3y5Xkr?type=png)](https://mermaid.live/edit#pako:eNp1UL1uAjEMfpXIAxO8wA0M6HgC6EQY3MSQU3NJSBydKsTWpe_A0pdrX6M-jkpFVb3E_n5sx2cw0RI0cPBxMA4zq-1KByVR6vMxY3KqELfIOKFjxEC7TMmjofWpom-J0v6BVovFUtmuJGTjnpJFpomnYKfkkRT95_VdJnkyPHp5iP-N-OP8evv45by7Jq20UbMf6LZUoGH8zE5eJX5UhaXLHubQU-6xs3KL82jWwI560tBIajG_aNDhIjqsHDevwUDDudIccqxHB80BfZGq3rZqO5Tb9Xf08g3y5Xkr)

那不帶 select 會使切換時 data 偵測到更新的原因是什麼？

首先要先知道，react-query 由 Observer 管理是否更新狀態，更新有可能會抓取 query client 不同的 Query 實體，所以並不是一個 Observer 永遠只配對同一個 Query 實體。

[![](https://mermaid.ink/img/pako:eNo1jb0OwjAMhF8l8kxeIAMDsCMoG2EwifsjmhRcB1RVfXcSFbz4zv5ON4MbPIGBuh8-rkUWddnZqPKcEvG07zuKorRuSJQgl_UqD6236ngfid_EK_93GU5Pj0IFGSWL65nQiaqKvtkIGwjEATufe-cStiAtBbJgsvTIDws2LpnDJEM1RQdGONEGeEhNC6bGfsxurTl02DCG33X5AiHqR20?type=png)](https://mermaid.live/edit#pako:eNo1jb0OwjAMhF8l8kxeIAMDsCMoG2EwifsjmhRcB1RVfXcSFbz4zv5ON4MbPIGBuh8-rkUWddnZqPKcEvG07zuKorRuSJQgl_UqD6236ngfid_EK_93GU5Pj0IFGSWL65nQiaqKvtkIGwjEATufe-cStiAtBbJgsvTIDws2LpnDJEM1RQdGONEGeEhNC6bGfsxurTl02DCG33X5AiHqR20)

因此 query key 的切換會導致 Observer 取到的 Query 實體不同，即便 Query class `setData` 本身會作結構共享，但實際 Observable 在更新 data 是兩個不同 Query 實體資料的切換，所以 data 會偵測到更新，如果是直接執行 `refetch` 就不會偵測到變更。

## 相關連結

重點參考函數
- [useBaseQuery](https://github.com/TanStack/query/blob/main/packages/react-query/src/useBaseQuery.ts)
    - `observer.getOptimisticResult`
    - `observer.getCurrentResult`
    - `observer.subscribe`
    - `observer.setOptions`
- [queryObserver](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryObserver.ts)
    - `setOptions`
    - `#executeFetch`
    - `updateResult`
    - `getOptimisticResult`
    - `createResult`
- [query](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts)
    - `fetch`
    - `setData`


