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
    }
}
