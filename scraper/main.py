"""Entry point for the scheduled job collectors."""

import traceback

import all_india
import freejobalert
import official_notifications
import enrich_apply_links
import repair_broken_links

# FreeJobAlert continues to collect Uttarakhand-specific jobs and repair
# existing records. The official-notifications collector separately pulls
# general notices, circulars, corrigendums and similar updates directly from
# official UKPSC and UKSSSC pages.
COLLECTORS = [freejobalert, all_india, official_notifications]


def main():
    for collector in COLLECTORS:
        name = collector.__name__
        try:
            collector.run()
        except Exception as exc:  # noqa: BLE001
            print(f"[error] {name} failed: {exc}")
            traceback.print_exc()

    # Run after all collectors so existing and newly scraped records get a
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
