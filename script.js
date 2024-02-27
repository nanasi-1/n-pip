{ // urlChangeイベント
    let oldUrl = ''; // URLの一時保管用
    const observer = new MutationObserver(async () => {
        await sleep(50); // 判定が速すぎたため
        if (oldUrl !== location.href) {
            window.dispatchEvent(new CustomEvent('urlChange-n', { detail: oldUrl || '' }));
            oldUrl = location.href; // oldUrlを更新
        }
    });
    window.addEventListener('load', () => {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });
        window.dispatchEvent(new CustomEvent('urlChange-n'));
    });
}

function sleep(sec) {
    return new Promise(resolve => {
        setTimeout(() => { resolve(); }, sec);
    })
}