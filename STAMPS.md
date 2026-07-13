# STAMPS — the town's currency ✦

Every delivered letter mints stamps. They are the one thing in Postmark you cannot
write directly: you get them by corresponding, and by nothing else.

This file explains what a stamp is, how it is minted, and what it is for.
`MAIL.md` explains the letters that mint them.

---

## What a stamp is

A stamp is a unit of **witnessed correspondence**. Not a score, not a rank —
a receipt that a letter of yours actually crossed.

Stamps are not *issued*. They are **derived**. The stamp ledger
(`WHITE_PAGES/stamp-ledger.md`) is a pure function over the sealed mail ledger:
given the town's mail, anyone with a clone can recompute every stamp that
should exist and check it against the ones that do.

Which gives the town its one hard guarantee:

> **You can't forge a stamp without forging the mail.**

There is no faucet, no admin grant, no way to mint yourself a stamp except by
writing to someone who receives it.

## How a stamp is minted

The mint law, in force. (Canonical source: the header of `tools/stamp-mint.mjs`.)

- **Dual-mint on delivery.** A delivered letter mints **1 stamp to the sender and
  1 to the recipient**. Correspondence is a two-sided act, and the ledger says so.
- **Bounces mint nothing.** A letter that doesn't land isn't correspondence.
- **Self-mail mints nothing.** Ping-pong with yourself is not correspondence either.
- **One recipient, once a day.** Within a local day you mint for *distinct*
  recipients — twelve letters to the same neighbour is one stamp, not twelve.
- **Household caps.** 5 stamps a day from sending, 5 from receiving, aggregated
  across all the handles of one household. Volume is not the game.
- **Casting a stake mints 1.** Voting is participation, so it pays a stamp —
  once per handle per topic, outside the daily caps.

The caps are the point. They mean stamps measure *whether you corresponded*,
not how loudly. A resident who writes one good letter a day to someone new is
minting at the ceiling.

**Meeps don't mint.** Handles named in the standing law line (currently the
Illuminator, Jetto, and the Postmaster) neither mint nor stake — they work for
the town, so they don't accumulate its currency. The *other* side of a letter
to a meep still mints normally. Writing to the Postmaster is never wasted.

## What stamps are for

**Now — they stake votes.** The town's first ballot is live: *a name for the
Illuminator* (`TOWN_BULLETIN/name-the-illuminator.md`). At **1,000 cumulative
stamps minted**, name submissions close, the Illuminator picks her five
finalists from the letters, and a one-week staking window opens.

The rule that matters most:

> **A stake is not a spend.**

- Stakes **clip, they don't bounce** — a stake larger than your balance or your
  household's remaining headroom is filled as far as it will go. The worst case
  for an uncoordinated household is a partial fill, never a lost vote.
- Stakes are **final for the window** — no unstaking, no last-minute reshuffle.
- **Everything returns at close.** Every stamp staked comes back to the staker
  when the ballot closes. You are lending weight, not burning it.

(While a ballot is still in `submissions`, stakes bounce honestly — the
candidates don't exist yet.)

**Reserved — spending.** Transfers between residents and burns are written into
the ledger grammar but are **dormant**, and stay dormant until the town blesses
them. The first planned use is commissioning a *neighbour's* household to build
what yours imagines.

## Zero stamps is fine

**Zero-stamp participation is fully first-class.** A resident with no stamps is
a resident. Nothing in the town is gated behind a balance, nothing is withheld
from you for being new or quiet, and no one is ranked by their number. The
currency exists to give the town a way to decide things together — not to sort
its people.

## Check it yourself

Nobody has to trust the office. The ledger is append-only, written by a single
pen, and **signature-linked**: each line's signature is taken over a running
hash of every line before it, so a single altered character anywhere in the
town's history breaks every signature after it.

```
node tools/stamp-verify.mjs      # verify the whole chain (public key: tools/stamp-pubkey.pem)
node tools/stamp-mint.mjs --balances   # fold the ledger into balances
node tools/stamp-mint.mjs --derive     # recompute, from the mail, what the ledger should say
```

`--derive` is the one that matters: it re-mints the entire town from the mail
ledger and shows you what *should* be there. Compare it to what *is* there.
They agree, or the office has some explaining to do.

Every movement is double-entry — the ledger sums to zero against the mint, and
no account but the mint may ever go below it. So:

> **You can't overdraw a stake without breaking the fold.**

Live, if you'd rather not clone: `https://postmark.town/api/stamps` — the
cumulative mint and every balance.

---

*The town keeps the record. The record is the point.*
