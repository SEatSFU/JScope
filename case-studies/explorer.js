// PR here: https://github.com/helium/explorer/pull/879/files
// unhandled rejection.

// ISSUE SUMMARY:
// Some items in the `list` object, obtained from the db,
// didn't have `timestamp` field, which caused the `for await of` stmt 
// to throw an error. But the error is not caught and handled,
// which causes the UI to get stuck in a loading state, trying to load
// the rest of the items.

import { isBefore, subDays } from 'date-fns'
import useSWR from 'swr'
import client from './client'
export const fetchOraclePrices = async () => {
  const timeLimit = subDays(new Date(), 30)
   const prices = []
   const list = await client.oracle.listPrices()

   for await (const oraclePrice of list) {
     if (isBefore(new Date(oraclePrice.timestamp), timeLimit))
       break

     prices.push(oraclePrice)
   }
   return prices
 }