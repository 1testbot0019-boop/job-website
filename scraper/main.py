"""
Entry point run by GitHub Actions on a schedule.
Runs every collector; one source failing (site down, selector broken)
should never stop the others from running.
"""

import traceback
import ukpsc
import uksssc
import police

COLLECTORS = [ukpsc, uksssc, police]


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
