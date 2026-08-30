"""Entry point for the scheduled job and government scheme collectors."""

import traceback

import all_india
import freejobalert
import government_schemes
import official_notifications
import enrich_apply_links
import repair_broken_links

COLLECTORS = [
    freejobalert,
    all_india,
    official_notifications,
    government_schemes,
]


def main():
    for collector in COLLECTORS:
        name = collector.__name__
        try:
            collector.run()
        except Exception as exc:  # noqa: BLE001
            print(f"[error] {name} failed: {exc}")
            traceback.print_exc()

    try:
        enrich_apply_links.run()
    except Exception as exc:  # noqa: BLE001
        print(f"[error] enrich_apply_links failed: {exc}")
        traceback.print_exc()

    try:
        repair_broken_links.run()
    except Exception as exc:  # noqa: BLE001
        print(f"[error] repair_broken_links failed: {exc}")
        traceback.print_exc()


if __name__ == "__main__":
    main()
