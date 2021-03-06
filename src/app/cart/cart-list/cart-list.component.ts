import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';

import { take } from 'rxjs/operators';
import { Subscription, BehaviorSubject } from 'rxjs';

import { Product } from 'src/app/shared/product.model';

import { CartService } from '../../shared/cart.service';
import { AuthService } from 'src/app/shared/auth.service';

@Component({
	selector: 'app-cart-list',
	templateUrl: './cart-list.component.html',
	styleUrls: ['./cart-list.component.css']
})
export class CartListComponent implements OnInit, OnDestroy {

	cartList: Product[] = [];//stores the products
	quantityList: number[] = [];//stores quantity of products
	cartPrice: number = 0;//stores cart's total price 
	shippingCharges: number;//stores shipping charges on every order
	totalPrice: number;//stores total amount to be paid (=cartPrice + shippingCharges)
	userSubscription: Subscription;
	cartPriceSubsription: Subscription;
	isLoading = false;//controls spinner
	userId: string = null;//stores user's id

	itemsReceived = new BehaviorSubject<boolean>(false);//used to next true if item is recieved from database
	itemsReceivedSubsription: Subscription;
	constructor(
		private cartService: CartService
		, private router: Router
		, private afs: AngularFirestore
		, private authservice: AuthService
	) { }

	/* It subscribes to the authservice for user details then it uses the details to
		 recive data about the user's cart and saves it locally, it also manages the
		 loading spinner */
	ngOnInit(): void {
		this.isLoading = true;
		this.shippingCharges = this.cartService.getShippingCharges();
		this.totalPrice = this.cartPrice + this.shippingCharges;
		this.userSubscription = this.authservice.user.subscribe(
			(user) => {
				if (user) {
					this.userId = user.uid;
					this.afs.collection('carts').doc(user.uid).set({ verified: true });
					this.afs.collection('carts').doc(user.uid).collection('item').get().pipe(take(1)).subscribe(
						(snapshot) => {
							this.cartList = [];
							this.quantityList = [];
							this.cartPrice = 0;
							snapshot.docs.forEach(
								(doc) => {
									let data = doc.data();
									this.afs.collection('products').doc(doc.id).get().pipe(take(1)).subscribe(
										(product) => this.cartList.push(<Product>product.data()),
										(error) => console.log(error),
										() => {
											this.quantityList.push(+data.quantity);
											this.itemsReceived.next(true);
										}
									);
								})
							this.itemsReceivedSubsription = this.itemsReceived.subscribe(
								(done) => {
									if (done) {
										this.cartService.orders = this.cartList;
										this.cartService.quantity = this.quantityList;
										this.cartService.calculateCartPrice();
										this.cartService.quantityUpdated.next(this.quantityList);
										this.cartService.cartPriceUpdated.next(this.cartPrice);
										this.totalPrice = this.shippingCharges + this.cartPrice;
									}
								}
							);
						},
						(error) => (console).log(error),
						() => this.isLoading = false
					)
				}
			}
		);
		this.cartPriceSubsription = this.cartService.cartPriceUpdated.subscribe(
			(newPrice) => {
				this.cartPrice = newPrice;
				this.totalPrice = this.cartPrice + this.shippingCharges;
			}
		)
	}

	// it navigates the user to address component 
	checkout() {
		this.router.navigate(['/cart', 'address']);
	}

	// it navigate the user to home component
	continueShopping() {
		this.router.navigate(['/home']);
	}

	// it unsubscribes every subscription to avoid memory leaks
	ngOnDestroy() {
		this.userSubscription.unsubscribe();
		this.cartPriceSubsription.unsubscribe();
		this.itemsReceived.unsubscribe();
	}
}
