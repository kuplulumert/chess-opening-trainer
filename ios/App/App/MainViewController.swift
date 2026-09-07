import Capacitor

// WKWebView's own scroll-view pan gesture recognizer holds/delays touches
// while it decides whether a gesture is a page scroll, which is enough to
// break a JS-driven drag interaction (dragging a chess piece) started
// inside the page — the piece never gets a clean touch stream to pick up
// on. Disabling those delays lets the DOM's own touch-action handling
// (already set to none on draggable pieces) take priority instead.
class MainViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        webView?.scrollView.delaysContentTouches = false
        webView?.scrollView.canCancelContentTouches = false
        // The page already reserves safe-area space itself via CSS
        // env(safe-area-inset-*) — without this, WKWebView's UIScrollView
        // ALSO applies its own automatic content inset for the same safe
        // area on top of that, so the visually laid-out content and the
        // coordinate space touch events are reported in drift apart by
        // roughly the status-bar/notch height. That's consistent with taps
        // landing a row off on the chessboard: react-chessboard compares a
        // live touch coordinate against a live getBoundingClientRect() of
        // the square, so a mismatch there points at WKWebView reporting
        // touches in a different frame than the one CSS laid content out
        // in, not at anything stale in the JS layer.
        webView?.scrollView.contentInsetAdjustmentBehavior = .never
    }
}
