document.addEventListener('DOMContentLoaded', () => {
    // Modal Logic
    const modal = document.getElementById('action-modal');
    const closeBtn = document.querySelector('.close-modal');
    const actionTriggers = document.querySelectorAll('.action-trigger');

    // Open modal when clicking field cards
    actionTriggers.forEach(card => {
        card.addEventListener('click', () => {
            modal.classList.remove('hidden');
        });
    });

    // Close modal
    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    // Close if clicking outside Content
    modal.querySelector('.modal-backdrop').addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    // Switch View Button (Animation & DOM Swap)
    const switchBtn = document.querySelector('.end-turn-btn');
    const arena = document.querySelector('.battle-arena');
    const playerField = document.querySelector('.player-field');
    const opponentField = document.querySelector('.opponent-field');

    switchBtn.addEventListener('click', () => {
        // 1. 盤面全体を180度回転アニメーション
        arena.style.transition = "transform 0.6s ease-in-out";
        arena.style.transform = "rotate(180deg)";

        setTimeout(() => {
            // 2. アニメーション完了後、回転をリセット
            arena.style.transition = "none";
            arena.style.transform = "rotate(0deg)";

            // 3. 中身のHTMLを入れ替えることで「元々の配置」を維持したまま視点を交代
            // まずHTML文字列レベルで交換
            const playerHTML = playerField.innerHTML;
            const opponentHTML = opponentField.innerHTML;

            playerField.innerHTML = opponentHTML;
            opponentField.innerHTML = playerHTML;

            // 4. 指定通り、playerField と opponentField 内の「active-row」と「bench-row」の上下を入れ替える
            // 画面の構造上、外側（上下両端）にベンチ、内側にアクティブが来る仕様を反転するため
            [playerField, opponentField].forEach(field => {
                const benchRow = field.querySelector('.bench-row');
                const activeRow = field.querySelector('.active-row');
                if (benchRow && activeRow) {
                    // 順番を入れ替える: 既存の最初の要素の前に2番目の要素を挿入する
                    if (benchRow.nextElementSibling === activeRow) {
                        field.insertBefore(activeRow, benchRow);
                    } else {
                        field.insertBefore(benchRow, activeRow);
                    }
                }
            });

            // 再度イベントリスナーを付け直す処理（モックアップ用なので簡易対応）
            const newTriggers = document.querySelectorAll('.action-trigger');
            newTriggers.forEach(card => {
                card.addEventListener('click', () => {
                    modal.classList.remove('hidden');
                });
            });

        }, 600); // Wait for transition to finish
    });
});
