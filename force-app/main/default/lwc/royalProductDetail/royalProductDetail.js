import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import basePath from '@salesforce/community/basePath';

// ★ LMS関連のインポート
import { publish, MessageContext } from 'lightning/messageService';
import CART_CHANNEL from '@salesforce/messageChannel/RoyalCartChannel__c';

// ★ NavigationMixin をインポート
import { NavigationMixin } from 'lightning/navigation';

import NAME_FIELD from '@salesforce/schema/Product2.Name';
import CODE_FIELD from '@salesforce/schema/Product2.ProductCode';
import DESC_FIELD from '@salesforce/schema/Product2.Description';
import FAMILY_FIELD from '@salesforce/schema/Product2.Family';
import IMAGE_FIELD from '@salesforce/schema/Product2.DisplayUrl';
import PRICE_FIELD from '@salesforce/schema/Product2.Price__c';

const FIELDS = [NAME_FIELD, CODE_FIELD, DESC_FIELD, FAMILY_FIELD, IMAGE_FIELD, PRICE_FIELD];

export default class RoyalProductDetail extends NavigationMixin(LightningElement) {
    @api recordId;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    product;

    // ★ LMSのコンテキストを取得
    @wire(MessageContext)
    messageContext;

    get name() {
        return getFieldValue(this.product.data, NAME_FIELD);
    }
    
    get productCode() {
        return getFieldValue(this.product.data, CODE_FIELD);
    }

    get description() {
        return getFieldValue(this.product.data, DESC_FIELD);
    }

    get family() {
        return getFieldValue(this.product.data, FAMILY_FIELD);
    }

    get imageUrl() {
        const rawUrl = getFieldValue(this.product.data, IMAGE_FIELD);
        
        if (!rawUrl) {
            // 画像がない場合のダミー
            return 'https://via.placeholder.com/600x600?text=No+Image';
        }

        // /sfsites/c をパスの間に挟む
        // basePath: "/theroyalbrew"
        // rawUrl: "/cms/delivery/media/..."
        
        const sitePrefix = basePath === '/' ? '' : basePath;
        
        // 結果: "/theroyalbrew/sfsites/c/cms/delivery/media/..."
        return `${sitePrefix}/sfsites/c${rawUrl}`;
    }

    get price() {
        const rawPrice = getFieldValue(this.product.data, PRICE_FIELD);
        if (!rawPrice) return '---'; // 価格未設定の場合

        // 通貨フォーマット (例: ¥2,500)
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY'
        }).format(rawPrice);
    }

    get isLoading() {
        return !this.product.data;
    }

    // --- Navigation 機能 ---

    // Homeへの遷移
    navigateToHome(event) {
        // href遷移を無効化（SPA遷移にするため）
        event.preventDefault();

        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage', // LWRではこれを使う
            attributes: {
                name: 'Home'
            }
        });
    }
    
    // Shopへの遷移（今回は例としてトップページの特定セクションなどを想定、あるいはHomeへ）
    navigateToShop(event) {
        event.preventDefault();
        
        // もし "/shop" というURLのページを作っているなら standard__webPage を使う
        // 今回はトップページに戻る挙動にします
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                name: 'Home'
            }
        });
    }

    // --- カート追加アクション ---
    handleAddToCart() {
        // 本来はここでApexを呼んでカートレコードを作成しますが、
        // 今回はまず「UIの連携」を見せるため、メッセージ送信のみ行います。

        const payload = {
            productId: this.recordId,
            productName: this.name
        };

        // メッセージを送信 (Fire!)
        publish(this.messageContext, CART_CHANNEL, payload);

        // ユーザーへのフィードバック（簡易的なアニメーション用クラス付与など）
        // 今回はコンソールログで確認
        console.log('Published Add to Cart:', payload);
    }

    // --- タイマー機能 ---
    timerInterval;
    timeLeft = 180; // デフォルト3分 (秒)
    isBrewing = false;
    isFinished = false;

    // 時間表示 (mm:ss)
    get timerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    }

    get isNotBrewing() {
        return !this.isBrewing;
    }

    // タイマー開始
    handleStartTimer() {
        if (this.isBrewing) return;
        
        this.isBrewing = true;
        this.isFinished = false;

        this.timerInterval = setInterval(() => {
            if (this.timeLeft > 0) {
                this.timeLeft--;
            } else {
                this.stopTimer();
                this.isFinished = true;
                this.isBrewing = false;
                // ここで「チン！」という音を鳴らしたり、トーストを出すのもオシャレです
            }
        }, 1000);
    }

    // タイマー停止（リセット）
    stopTimer() {
        clearInterval(this.timerInterval);
    }
    
    // コンポーネント破棄時にタイマーを止める（メモリリーク防止）
    disconnectedCallback() {
        this.stopTimer();
    }
}