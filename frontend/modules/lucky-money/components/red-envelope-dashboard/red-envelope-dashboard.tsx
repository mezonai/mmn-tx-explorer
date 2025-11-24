'use client'

import { Separator } from "@radix-ui/react-separator"
import { RedEnvelopeStats } from "./red-envelope-stats/red-envelope-stats"
import { ClaimedEnvelopes, CreatedEnvelopes } from "./red-envelope-list"

export const LuckyMoney = () => {
  return (
    <div className="container mx-auto max-w-7xl space-y-8 sm:space-y-12 md:space-y-16 px-3 sm:px-4 pb-8 sm:pb-12 md:pb-16">
      <RedEnvelopeStats />
      <Separator className="bg-gray-200/70 dark:bg-gray-800" />
      <CreatedEnvelopes />
      <ClaimedEnvelopes />
    </div>
  )
}