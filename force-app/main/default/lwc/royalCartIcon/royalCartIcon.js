import { LightningElement, wire } from 'lwc';
// LMS関連
import { subscribe, MessageContext } from 'lightning/messageService';
import CART_CHANNEL from '@salesforce/messageChannel/RoyalCartChannel__c';

export default class RoyalCartIcon extends LightningElement {
    cartCount = 0;
    subscription = null;

    @wire(MessageContext)
    messageContext;

    // コンポーネント配置時に購読開始
    connectedCallback() {
        this.subscribeToMessageChannel();
    }

    subscribeToMessageChannel() {
        if (!this.subscription) {
            this.subscription = subscribe(
                this.messageContext,
                CART_CHANNEL,
                (message) => this.handleMessage(message)
            );
        }
    }

    handleMessage(message) {
        // メッセージを受け取ったらカウントを増やす
        console.log('Received Add to Cart:', message);
        this.cartCount++;
        
        // ★ブログ用演出: アイコンを揺らすなどのアニメーションフラグを立てるのも良し
    }
}