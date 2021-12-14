import clsx from 'clsx'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import React from 'react'

import { Contract, deleteContract } from '../lib/firebase/contracts'
import { formatMoney } from '../lib/util/format'
import { Col } from './layout/col'
import { Spacer } from './layout/spacer'

export function ResolvedPanel(props: {
  contract: Contract
  className?: string
}) {
  const router = useRouter()

  const { contract, className } = props

  const { resolution, resolutionTime, pot, seedAmounts } = contract

  const total = pot.YES + pot.NO - seedAmounts.YES - seedAmounts.NO

  const color =
    resolution === 'YES'
      ? 'text-primary'
      : resolution === 'NO'
      ? 'text-red-400'
      : resolution === 'CANCEL'
      ? 'text-yellow-400'
      : 'text-gray-500'

  return (
    <Col
      className={clsx(
        'bg-gray-100 shadow-xl px-8 py-6 rounded-md w-full md:w-auto',
        className
      )}
    >
      <div className={clsx('font-bold font-sans text-5xl')}>
        Resolved: <span className={color}>{resolution}</span>
      </div>

      <Spacer h={4} />
      <div className="text-gray-500">
        {dayjs(resolutionTime).format('MMM D, HH:mma')}
      </div>
      <Spacer h={4} />

      <div className="text-gray-700">
        {resolution === 'YES' ? (
          <>Yes bettors have collectively won {formatMoney(total)}.</>
        ) : resolution === 'NO' ? (
          <>No bettors have collectively won {formatMoney(total)}.</>
        ) : (
          <>All bets have been returned.</>
        )}
      </div>

      {/* Show a delete button for contracts without any trading */}
      {total === 0 && (
        <button
          className="btn btn-xs btn-error btn-outline mt-1 max-w-fit"
          onClick={async (e) => {
            e.preventDefault()
            await deleteContract(contract.id)
            router.push('/markets')
          }}
        >
          Delete
        </button>
      )}
    </Col>
  )
}
