/**
 * ピクチャーインピクチャーにする関数
 * @param {HTMLIFrameElement} elem 
 */
async function pip(elem) {
    if (documentPictureInPicture.window) return;
    const container = elem.parentElement; // 復帰用
    const pip = await documentPictureInPicture.requestWindow({
        width: 800,
        height: 1200,
    });
    pip.document.body.append(elem);

    pip.addEventListener("unload", (event) => {
        container.append(elem);
    });
    return pip;
}

window.addEventListener('urlChange-pip', async () => {
    // 教材
    if ((new RegExp('/courses/.*/chapters/.*/.*/.*')).test(location.href)) {
        await sleep(300);
        const ifr = await promiseLoop(() => {
            return document.querySelector('iframe[title="教材"]');
        }, [null]);
        if (!ifr || ifr?.contentDocument?.baseURI === location.href) {
            console.info(`N-PiP: ifr要素が空または正常ではありませんでした。このログはPiPボタンをクリックしたときにも出ます。 ifr: ${ifr}`);
            return;
        };

        appendBtn(() => pip(ifr), await promiseLoop(() => getHeader(document)));
    }

    // フォーラム
    if ((new RegExp('/questions/.*')).test(location.href)) {
        const pList = await promiseLoop(() => document.querySelector('#root div:not([role="banner"] *)>p'), [null]);
        if (!pList) return;
        const aElem = pList.parentElement.querySelector('a');

        aElem.addEventListener('click', async () => {
            await sleep(300);
            const ifr = await promiseLoop(() => document.querySelector('[title="引用教材"]'));
            if (!ifr || !ifr?.contentDocument) {
                console.debug('N-PiP: 教材の要素が見つかりませんでした ifr:', ifr, ifr?.contentDocument);
                return;
            }
            if (ifr.contentDocument.querySelector('#pip-btn')) {
                console.debug('N-PiP: PiPボタンはすでにあります');
                return;
            }
            await promiseLoop(() => appendBtn(() => pip(ifr), getHeader(document, '')));
        });
    }
});

/** ボタンの追加先であるヘッダーを取得する関数 */
function getHeader(doc, typeInput) {
    const type = typeInput ?? location.href.match(/exercise|movie|guide/)[0]
    if (type !== 'movie') {
        return doc.querySelector('h3+div')
    }
    const movieDoc = doc.querySelector('iframe[title="教材"]').contentDocument
    return movieDoc.querySelector('h3+div')
}

/** ボタンを生成する関数 */
function generateBtn(handle, header) {
    const btn = document.createElement('button');
    btn.id = "pip-btn";

    const classes = header?.querySelector('a')?.className;
    if (classes) {
        btn.className = classes
    }

    btn.textContent = 'PiPで見る';
    btn.addEventListener('click', handle);
    return btn;
}


/** 
 * ボタンを追加する関数 
 * @param {() => Promise<any>} handle 
 * @param {HTMLElement} doc   
 */
function appendBtn(handle, header) {
    if (!header) {
        throw new Error(`header要素が${header}でした。読み込みが遅い可能性があります`);
    };
    if (header.querySelector('#pip-btn')) {
        console.debug('N-PiP: PiPボタンはすでにあります');
        return;
    };

    const btn = generateBtn(handle, header);
    header.insertBefore(btn, header.querySelector('button'));
}

{ // urlChangeイベント
    let oldUrl = ''; // URLの一時保管用
    const observer = new MutationObserver(async () => {
        await sleep(50); // 判定が速すぎたため
        if (oldUrl !== location.href) {
            window.dispatchEvent(new CustomEvent('urlChange-pip', { detail: oldUrl || '' }));
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
        window.dispatchEvent(new CustomEvent('urlChange-pip'));
    });
}

async function promiseLoop(func, ngList = [], isThrow = false) {
    const TRIAL = 20;
    const SLEEP_MS = 50;
    for (let i = 0; i < TRIAL; i++) {
        try {
            const result = await func();
            if (ngList.includes(result)) throw new Error(`関数の実行結果が${result}でした`);
            return result;
        } catch (e) {
            await sleep(SLEEP_MS);
            if (i >= TRIAL - 1) { // ループじゃ解決しなかった場合
                const errObj = new Error(`N-PiP：loopで解決しないエラーが発生しました：${e.message} ${e.stack}`);
                if (isThrow) {
                    console.error(errObj);
                    throw errObj;
                } else {
                    console.info(errObj);
                    return;
                }
            }
        }
    }
}

function sleep(sec) {
    return new Promise(resolve => {
        setTimeout(() => { resolve(); }, sec);
    })
}
