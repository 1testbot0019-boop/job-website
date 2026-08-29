"""Entry point for the scheduled job collectors."""

import traceback

import all_india
import freejobalert

# FreeJobAlert continues to collect Uttarakhand-specific notices and repair
# existing records. all_india adds the other Indian states and UTs.
COLLECTORS = [freejobalert, all_india]


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
