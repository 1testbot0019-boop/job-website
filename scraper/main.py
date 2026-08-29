"""Entry point for the scheduled job collectors."""

import traceback

import all_india
import freejobalert
import enrich_apply_links
import repair_broken_links

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

    # Run after both collectors so existing and newly scraped records get a
    # direct application-portal URL whenever the source page exposes one.
    try:
        enrich_apply_links.run()
    except Exception as exc:  # noqa: BLE001
        print(f"[error] enrich_apply_links failed: {exc}")
        traceback.print_exc()

    # Replace expired cloud-storage links with permanent official links, or
    # clear temporary links when no safe replacement can be verified.
    try:
        repair_broken_links.run()
    except Exception as exc:  # noqa: BLE001
        print(f"[error] repair_broken_links failed: {exc}")
        traceback.print_exc()


if __name__ == "__main__":
    main()
