"""
Entry point run by GitHub Actions on a schedule.
Runs every collector; one source failing (site down, selector broken)
should never stop the others from running.

NOTE: ukpsc, uksssc and police (the direct government-site collectors)
are disabled here because those sites block requests from GitHub Actions'
cloud IP ranges - confirmed by the fact they load fine from a normal
Indian home connection but consistently time out from GitHub's servers.
freejobalert mirrors the same official notices and isn't locked down the
same way, so it's the active source for now. The government-site files
are kept in this folder (not deleted) in case you later run the scraper
from an Indian IP (self-hosted runner or an Indian VPS) and want to
re-enable them for more direct, first-party sourcing.
"""

import traceback
import freejobalert
# import ukpsc
# import uksssc
# import police

COLLECTORS = [freejobalert]


def main():
    for collector in COLLECTORS:
        name = collector.__name__
        try:
            collector.run()
        except Exception as exc:  # noqa: BLE001
            print(f"[error] {name} failed: {exc}")
            traceback.print_exc()


if __name__ == "__main__":
    main()
