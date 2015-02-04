/**
 *
 * Crunchbutton
 *
 * @author: 	Devin Smith (http://devin.la)
 * @date: 		2012-06-20
 *
 */

var REDIRECT = false;

if (top.frames.length != 0 || window != top || top.location != location) {
	top.location.href = location.href;
	top.location = self.document.location;
	REDIRECT = true;
}

var App = {
	tagline: '',
	service: '/api/',
	logService: 'http://log.crunchbutton.com/api/',
	server: '/',
	imgServer: '/',
	cached: {},
	community: null,
	config: null,
	_init: false,
	_pageInit: false,
	_identified: false,
	touchX: null,
	touchY: null,
	touchOffset: null,
	localStorage: false,
	isPhoneGap: document.location.protocol == 'file:',
	useNativeAlert: false,
	useNativeConfirm: true,
	ajaxTimeout: 5000,
	splashHidden: false,
	parallax: {
		bg: null,
		x: 0,
		y: 0,
		enabled: true
	},
	restaurantsPaging: {
		enabled: true,
		desktop: 9,
		mobile: 6
	},
	transitionAnimationEnabled : true,
	transitionForDesktop : false,
	cachedObjectsExpiresIn : 86400, // 86400 seconds is 24 hours
	enableSplash: true,
	useTransform: true
};

// enable localstorage on phonegap
App.localStorage = App.isPhoneGap;

App.setLoggedIn = function(loggedIn) {
	if ($('.is-ui2').get(0) && !loggedIn && App.isPhoneGap && App.enableSplash) {
		var goToSplash = true;
		if( localStorage && localStorage.locsv3 ){
			var locsv3 = JSON.parse( localStorage.locsv3 );
			if( locsv3 && locsv3.length > 0 ){
				goToSplash = false;
			}
		}
		if( goToSplash ){
			setTimeout( function(){ App.go( '/splash' ); }, 10 );
		}
	}
};

App.NGinit = function() {
	$('body').attr('ng-controller', 'AppController');
	angular.bootstrap(document,['NGApp']);
	if (App.config.env == 'live') {
		$('.footer').addClass('footer-hide');
	}
};

var NGApp = angular.module('NGApp', [ 'ngRoute', 'ngAnimate', 'ngResource' ] );

NGApp.config(function($compileProvider){
	$compileProvider.aHrefSanitizationWhitelist(/.*/);
});

NGApp.run(function() {
	FastClick.attach(document.body);
} );


// This config will intercept all the ajax requests and take care of the errors
NGApp.config( function( $provide, $httpProvider ) {
	$provide.factory( 'httpInterceptor', function( $q ) {
		var onError = function( rejection ){
			var status = rejection.status;
			// Is offline or the server wasn't found
			if( !window.navigator.onLine || status == 0 ){
				var showError = false;
				var url = rejection.config.url;

				if ( url ) {
					console.log('AJAX ERROR: ', rejection );
					// Check if the url was an api url
					if( url.indexOf( App.service ) >= 0 ){
						var api = url.split( App.service );
						if( api.length > 0 ){
							// Get the api endpoint
							api = api[1];
							var showErrorFor = [ 'order', 'restaurant', 'user' ];
							for( var i = 0; i < showErrorFor.length; i++ ){
								if( api.indexOf( showErrorFor[i] ) >= 0 ){
									showError = true;
									break;
								}
							}
						}
					}
				} else {
					showError = true;
				}
				if( showError && !$( '.connection-error' ).is( ':visible' ) ){
					App.connectionError();
					if ( App.busy.isBusy() ) {
						App.busy.unBusy();
					}
				}
			}
		}

		return {
			// request ok
			request: function( config ) {
				return config || $q.when( config );
			},
			// response ok
 			response: function( response ) {

 				if( typeof response.data == 'object' ){
 					var headers = response.headers();
 				}

				return response || $q.when( response );
			},
			// request no ok
			requestError: function( rejection ) {
				onError( rejection );
				return $q.reject( rejection );
			},
			// response no ok
			responseError: function ( rejection ) {
				onError( rejection );
				return $q.reject( rejection );
			}
		};
	});
	$httpProvider.interceptors.push( 'httpInterceptor' );
} );


NGApp.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider, RestaurantsService) {
	$routeProvider
		.when('/location', {
			action: 'location',
			controller: 'LocationCtrl',
			templateUrl: 'assets/view/location.html'
		})
		.when('/splash', {
			action: 'splash',
			controller: 'SplashCtrl',
			templateUrl: 'assets/view/splash.html'
		})
		.when('/download', {
			action: 'download',
			controller: 'DownloadCtrl',
			templateUrl: 'assets/view/download.html'
		})
		.when('/food-delivery', {
			action: 'restaurants',
			controller: 'RestaurantsCtrl',
			templateUrl: 'assets/view/restaurants.html'
		})
		.when('/food-delivery/:id', {
			action: 'restaurant',
			controller: 'RestaurantCtrl',
			templateUrl: 'assets/view/restaurant.html'
		})
		.when('/legal', {
			action: 'legal',
			controller: 'LegalCtrl',
			templateUrl: 'assets/view/legal.html'
		})
		.when('/help', {
			action: 'help',
			controller: 'HelpCtrl',
			templateUrl: 'assets/view/help.html'
		})
		.when('/about', {
			action: 'about',
			controller: 'AboutCtrl',
			templateUrl: 'assets/view/about.html'
		})
		.when('/jobs', {
			action: 'jobs',
			controller: 'JobsCtrl',
			templateUrl: 'assets/view/jobs.html'
		})
        .when('/drivers/apply', {
			action: 'apply',
			controller: 'ApplyCtrl',
			templateUrl: 'assets/view/apply.html'
		})
        .when('/thankyou', {
			action: 'thankyou',
			controller: 'ThankyouCtrl',
			templateUrl: 'assets/view/thankyou.html'
		})
		.when('/owners', {
			action: 'owners',
			controller: 'OwnersCtrl',
			templateUrl: 'assets/view/owners.html'
		})
		.when('/orders', {
			action: 'orders',
			controller: 'OrdersCtrl',
			templateUrl: 'assets/view/orders.html'
		})
		.when('/order/:id', {
			action: 'order',
			controller: 'OrderCtrl',
			templateUrl: 'assets/view/order.html'
		})
		.when('/cities', {
			action: 'cities',
			controller: 'CitiesCtrl',
			templateUrl: 'assets/view/cities.html'
		})
		.when('/giftcard', {
			action: 'giftcard',
			controller: 'GiftcardCtrl',
			templateUrl: 'assets/view/home.html'
		})
		.when('/giftcard/:id', {
			action: 'giftcard',
			controller: 'GiftcardCtrl',
			templateUrl: 'assets/view/home.html'
		})
		.when('/gift', {
			action: 'giftcard',
			controller: 'GiftcardCtrl',
			templateUrl: 'assets/view/home.html'
		})
		.when('/gift/:id', {
			action: 'giftcard',
			controller: 'GiftcardCtrl',
			templateUrl: 'assets/view/home.html'
		})
		.when('/invite', {
			action: 'giftcard',
			controller: 'GiftcardCtrl',
			templateUrl: 'assets/view/home.html'
		})
		.when('/invite/:id', {
			action: 'giftcard',
			controller: 'GiftcardCtrl',
			templateUrl: 'assets/view/home.html'
		})
		.when('/reset', {
			action: 'reset',
			controller: 'AccountResetCtrl',
			templateUrl: 'assets/view/home.html'
		})
		.when('/reset/:id', {
			action: 'reset',
			controller: 'AccountResetCtrl',
			templateUrl: 'assets/view/home.html'
		})
		.when('/', {
			action: 'home',
			controller: 'HomeCtrl',
			templateUrl: 'assets/view/home.html'
		})
		.when('/cafe', {
			action: 'cafe',
			controller: 'CafeCtrl',
			templateUrl: 'assets/view/cafe.html'
		})
		.otherwise({
			action: 'home',
			controller: 'DefaultCtrl',
			templateUrl: 'assets/view/home.html'
		})
	;
	// only use html5 enabled location stuff if its not in a phonegap container
	$locationProvider.html5Mode(!App.isPhoneGap);
}]);

// global route change items
NGApp.controller('AppController', function ($scope, $route, $http, $routeParams, $rootScope, $location, $window, AccountService, MainNavigationService, AccountSignOut, CartService, ReferralService, LocationService, PhoneGapService ) {
	// define external pointers
	App.rootScope = $rootScope;
	App.location = $location;
	App.http = $http;


	// hack to fix the phonegap bug at android with soft keyboard #2908
	$rootScope.softKeyboard = function( e ){
		if( App.isPhoneGap && App.isAndroid() ){
			var el = $( e.currentTarget );
			var walkTo = ( $('.snap-content-inner').scrollTop() + el.offset().top - ( $( window ).height() / 2 ) + ( el.height() + 55 ) );
			$( 'html, body, .snap-content-inner' ).animate( { scrollTop: walkTo }, '500');
		}
	}

	// hack to fix the phonegap bug at android with soft keyboard #2908 - input at modals
	$rootScope.softKeyboardModal = function( e ){
		if( App.isPhoneGap && App.isAndroid() ){
			var el = $( '.mfp-content' );
			if( el.css( 'marginTop' ) == '0px' ){
				var walkTo = el.offset().top + 20;
				el.animate( { marginTop: -walkTo }, '500');
			}
		}
	}

	// define global services
	$rootScope.account = AccountService;
	$rootScope.navigation = MainNavigationService;
	$rootScope.signout = AccountSignOut;
	$rootScope.isPhoneGap = App.isPhoneGap;
	$rootScope.server = App.server;

	$rootScope.animationClass = '';

	$rootScope.debug = function() {
		return ( App.config && App.config.user && App.config.user.debug );
	};

	$rootScope.test = App.test;

	$rootScope.cartScroll = function(permalink) {
		//$('.snap-content-inner').scrollTop() + $('.cart-items').offset().top
		var top = 130 - $('.navs').height() - 10;


		var scroll = function() {
			$('html, body, .snap-content-inner').animate({scrollTop: top}, 100, $.easing.easeInOutQuart ? 'easeInOutQuart' : null);
		};
		if ($rootScope.navigation.page != 'restaurant') {
			$rootScope.scrollTop = top;
			App.go('/food-delivery/' + permalink);
		} else {
			scroll();
		}
	};

	$rootScope.scrollHalf = function(permalink) {
		$('html, body, .snap-content-inner').animate({
			scrollTop: 530 - $('.navs').height() - 10
		}, 100, $.easing.easeInOutQuart ? 'easeInOutQuart' : null);
	};

	$rootScope.cancelDownload = function() {
		$.cookie('_viewmobile2', true, { expires: 1 });
		App.go('/location');
	};

	$rootScope.$on('userAuth', function(e, data) {
		$rootScope.$safeApply(function($scope) {
			// @todo: remove double data
			if (data) {
				$rootScope.account.user = data;
				App.config.user = data;
			}
			// If the user logged out clean the cart!
			if( !App.config.user.id_user ){
				CartService.clean();
			}

			LocationService.init(true);

			if (App.config.user.id_user && App.config.user.location_lat && ($rootScope.navigation.page == 'location' || $rootScope.navigation.page == 'splash')) {
				$location.path('/food-delivery');
			}

			App.snap.close();

			// reload the actual controller
			if( !AccountService.forceDontReloadAfterAuth ){
				$rootScope.reload();
			}
			AccountService.forceDontReloadAfterAuth = false;
		});
	});

	$rootScope.focus = function( selector ){
		setTimeout(function(){
			angular.element( selector ).focus();
		}, 100);
	}

	$rootScope.blur = function( selector ){
		setTimeout(function(){
			angular.element( selector ).blur();
		}, 100);
	}

	/* @info: this is how you watch an object rather than a property so i remeber
	$rootScope.$watch('account.user', function() {
		// indicates that the user object has changed
	}, true);
	*/

	$rootScope.reload = function() {
		$route.reload();
	};

	$rootScope.link = function(link) {
		App.go.apply(arguments);
	};

	$rootScope.back = function() {
		App.snap.close();
		var backwards = false;
		switch( $route.current.action ) {
			case 'order':
				backwards = '/orders';
				break;
			case 'restaurant':
				backwards = '/food-delivery';
				break;
			case 'restaurants':
				backwards = '/location';
				break;
		}
		if ( backwards ) {
			App.go( backwards, 'pop' );
		} else {
			history.back();
		}
	};

	$rootScope.closePopup = function() {
		try {
			$.magnificPopup.close();
		} catch (e) {}
	};

	$rootScope.$safeApply = function(fn) {
		var phase = this.$root.$$phase;
		if (phase == '$apply' || phase == '$digest') {
			if (fn && (typeof(fn) === 'function')) {
				this.$eval(fn);
			}
		} else {
			this.$apply(fn);
		}
	};

	// @todo: we might need this in the future for when we update to angular 1.2 with animations
	/*
	// determine if we are going backwards
	$rootScope.$on('$locationChangeSuccess', function() {
		$rootScope.actualLocation = $location.path();
	});

	$rootScope.$watch(function() {
		return $location.path();
	}, function (newLocation, oldLocation) {
		if ($rootScope.actualLocation === newLocation) {
			// this is backwards
		}
	});
	*/

	$scope.$on('$routeChangeSuccess', function ($currentRoute, $previousRoute) {
		// Store the actual page
		MainNavigationService.page = $route.current.action;
		App.rootScope.current = MainNavigationService.page;
		App.track('page', $route.current.action);

		$('body').removeClass(function (index, css) {
			return (css.match (/\bpage-\S+/g) || []).join(' ');
		}).addClass('page-' + MainNavigationService.page);

		$('.nav-top').addClass('at-top');

		App.parallax.bg = null;

		App.scrollTop($rootScope.scrollTop);
		$rootScope.scrollTop = 0;

	});

	// Make the window's size available to all scope
	$rootScope.windowWidth = $('body').width();
	$rootScope.windowHeight = $('body').height();

	// Window resize event
	angular.element( $window ).bind( 'resize',function(){
		$rootScope.windowWidth = $window.outerWidth;
		$rootScope.windowHeight = $window.outerHeight;
		$rootScope.$apply( 'windowWidth' );
		$rootScope.$apply( 'windowHeight' );
	});

	$scope.hasLocations = function(){
		return ( LocationService.position.hasValidLocation() );
	}

	AccountService.checkUser();

	LocationService.init();

	ReferralService.check();

});

App.alert = function(txt, title, useNativeAlert, fn) {
	setTimeout(function() {
		if (useNativeAlert && App.isPhoneGap) {
			navigator.notification.alert(txt, null, title || 'Crunchbutton');
		} else if ( useNativeAlert ) {
			alert( txt );
		} else {
			App.rootScope.$broadcast('notificationAlert', title || 'Woops!', txt, fn);
		}
	});
};

App.confirm = function(txt, title, fn, buttons) {
	if (App.useNativeConfirm && App.isPhoneGap) {
		return navigator.notification.confirm(txt, fn, title || 'Crunchbutton', buttons || 'Ok,Cancel' );
	} else {
		return confirm(txt);
	}
};


App.connectionError = function() {
	App.rootScope.$broadcast( 'connectionError' );
	App.rootScope.$broadcast('notificationAlert', 'Connection Error', 'Sorry! We could not reach the server right now. Try again when your internet is back!');
};

App.go = function( url, transition ){
	// Remove the animation from rootScope #2827 before start the new one
	App.rootScope.animationClass = '';
	if( !App.transitionAnimationEnabled ){
		App.location.path( url || '/' );
		App.rootScope.$safeApply();
		return;
	}

	if( App.isNarrowScreen() || App.transitionForDesktop ){
		setTimeout( function(){
			App.rootScope.animationClass = transition ? 'animation-' + transition : '';
			App.rootScope.$safeApply();
			// @todo: do some tests to figure out if we need this or not
			// App.location.path(!App.isPhoneGap ? url : 'index.html#' + url);
			App.location.path( url || '/' );
			App.rootScope.$safeApply();
		}, 1 );
	} else {
		App.location.path( url || '/' );
		App.rootScope.$safeApply();
	}
};

App.toggleMenu = function() {
	if (App.snap.state().state == 'left') {
		App.snap.close();
	} else {
		App.snap.open('left');
	}
};


/*
App.setTop = function() {
	$('html, body, .snap-content-inner').scrollTop(0);
	setTimeout(function() {
		$('html, body, .snap-content-inner').scrollTop(0);
	},13);


	$('#ng-view').css('-webkit-transform','translate3d(0,0,0)');
	setTimeout(function() {
		$('#ng-view').css('-webkit-transform','');
	},1000);


};
*/


/**
 * scroll to the top of the page
 */
App.scrollTop = function(top) {
	setTimeout(function() {
		if (!top) {
			setTimeout(function() {
				$('html, body, .snap-content-inner').scrollTop(0);
			},10);
		}
		$('html, body, .snap-content-inner').animate({scrollTop: top || 0}, 10, $.easing.easeInOutQuart ? 'easeInOutQuart' : null);
	},3);
};


/**
 * Sends a tracking item to google, or to google ads if its an order
 */
App.track = function() {
	if (App.config.env != 'live') {
		return;
	}

	if (arguments[0] == 'Ordered') {
		if (typeof( ga ) == 'function') {
			var trans = {
				id: arguments[1].id,
				affiliation: 'Crunchbutton',
				revenue: arguments[1].total,
				subtotal: arguments[1].subtotal,
				tax: arguments[1].tax,
				tip: arguments[1].tip
			};
			ga('ecommerce:addTransaction', trans);


			for (var x in arguments[1].cart) {
				var ii = {
					id: arguments[1].id,
					name: arguments[1].cart[x].details.name,
					sku: arguments[1].cart[x].id,
					category: arguments[1].restaurant,
					restaurant: arguments[1].id_restaurant,
					price: App.cached['Dish'][arguments[1].cart[x].id].price,
					quantity: '1'
				};
				ga('ecommerce:addItem', ii);
			}

			ga('ecommerce:send');
		}


		$('img.conversion').remove();
		var i = $('<img class="conversion" src="https://www.googleadservices.com/pagead/conversion/996753959/?value=' + Math.floor(arguments[1].total) + '&amp;label=-oawCPHy2gMQp4Sl2wM&amp;guid=ON&amp;script=0&url=' + location.href + '">').appendTo($('body'));
	}

	if (typeof( ga ) == 'function') {
		ga('send', 'event', 'app', arguments[0], arguments[1]);
	}
};


/**
 * controls the busy state of the app
 * @sky-loader
 */
App.busy = {
	_busy: false,
	_timer: null,
	_maxExec: 25000,
	stage: function() {
		$('#Stage').height('100%').width('100%');
		return AdobeEdge.getComposition('EDGE-977700350').getStage();
	},
	isBusy: function() {
		return $('.app-busy').length ? true : false;
		return App.busy._busy;
	},
	makeBusy: function( gid ) {
		if (App.busy._timer) {
			clearTimeout(App.busy._timer);
		}
		App.busy._timer = setTimeout(function() {
			var errorMessage = function(){
				App.alert('The app timed out processing your order. We can not determine if the order was placed or not. Please check your previous orders. Sorry!');
				App.busy.unBusy();
			};
			if( gid ){
				App.request( App.service + 'order/gid/' + gid,
					function( json ){
						if( json.error ){
							errorMessage();
						}
					}, function(){ errorMessage(); } );
			}
		}, App.busy._maxExec );
		return $('body').append($('<div class="app-busy"></div>').append($('<div class="app-busy-loader"><div class="app-busy-loader-icon"></div></div>')));
		App.busy._busy = true;
		$('.order-sky-loader').addClass('play');
		App.busy.stage().play(0);
	},
	unBusy: function() {
		clearTimeout(App.busy._timer);
		return $('.app-busy').remove();
		App.busy._busy = false;
		$('.order-sky-loader').removeClass('play');
		App.busy.stage().stop();
	}
};

/**
 * stuff for testing
 */
App.test = {
	card: function() {
		angular.element( 'html' ).injector().get( 'OrderService' )._test();
	},
	logout: function() {
		$.getJSON(App.service + 'logout',function(){ location.reload()});
	},
	cart: function() {
		App.alert(JSON.stringify(App.cart.items));
	},
	clearloc: function() {
		$.totalStorage('community',null);
		$.totalStorage('location_lat',null);
		$.totalStorage('location_lon',null);
		location.href = '/';
	},
	reload: function() {
		location.reload();
	},
	location: function(){
		var position = angular.element( 'html' ).injector().get( 'PositionsService' );
		var locs = position.locs;
		for( x in locs ){
			var values = [];
			$.each( locs[ x ]._properties, function( key, value ) {
				values.push( key );
				values.push( ': ' );
				values.push( ( value || '-' ) );
				values.push( ' | ' );
				if( key == 'results' ){
					$.each( value, function( position, result ) {
						console.log('result: ' + position,result);
					});
				}
			});
			console.log('Position: ' + x, values.join( '' ) );
		}
	}
};

App.processConfig = function(json, user) {
	if (user && !json) {
		App.config.user = user;
	} else {
		App.config = json;
	}
	App.setLoggedIn( App.config && App.config.user && App.config.user.uuid ? true : false);
	App.AB.init();
};

/**
 * global event binding and init
 */
App.init = function(config) {
	// ensure this function cant be called twice. can crash the browser if it does.
	if (App._init || REDIRECT) {
		return;
	}

	App._init = true;

	// Check if the device is online or offline
	App.verifyConnection.init();
	App.phoneGapListener.init();

	$(document).on('touchmove', ($('.is-ui2').get(0) ? '.mfp-wrap' : '.snap-drawers, .mfp-wrap, .support-container'), function(e) {
		e.preventDefault();
		e.stopPropagation();
	});

	$(document).on({
		'DOMNodeInserted': function() {
			$('.pac-item, .pac-item span', this).addClass('needsclick');
		}
	}, '.pac-container');

	$(document).on('mousedown', '.pac-item', function() {
		$('body').scrollTop(0);
		$('html').css('height','3000px');
		setTimeout(function() {
			$('html').css('height','');
		});
	});

	// add ios7 styles for nav bar and page height
	if (App.isPhoneGap && !App.iOS7()) {
		$('body').removeClass('ios7');
	}

	$('body').removeClass('no-init');

	// add the side swipe menu for mobile view
	if (typeof Snap !== 'undefined') {
		App.snap = new Snap({
			element: document.getElementById('snap-content'),
			menu: $('#side-menu'),
			useTransform : App.useTransform,
			menuDragDistance: 95,
			disable: 'right'
		});

		App.snap.on( 'end', function(){
			App.applyIOSPositionFix();
		});

		App.snap.on( 'start', function(){
			App.applyIOSPositionFix();
		});

		var snapperCheck = function() {
			if ($(window).width() <= 768) {
				App.snap.enable();
			} else {
				App.snap.close();
				App.snap.disable();
			}
		};
		snapperCheck();

		$(window).resize(function() {
			snapperCheck();
		});

	}

	// init the storage type. cookie, or localstorage if phonegap
	$.totalStorage.ls(App.localStorage);

	// phonegap
	if (typeof CB !== 'undefined' && CB.config) {
		App.config = CB.config;
		CB.config = null;
	}

	// @todo: is this isued anymore in ui2?
	$(document).on('click', '.button-deliver-payment, .dp-display-item a, .dp-display-item .clickable', function() {
		$('.payment-form').show();
		$('.delivery-payment-info, .content-padder-before').hide();
	});

	// @todo: is this isued anymore in ui2?
	$(document).on({
		mousedown: function() {
			$(this).addClass('button-bottom-click');
		},
		touchstart: function() {
			$(this).addClass('button-bottom-click');
		},
		mouseup: function() {
			$(this).removeClass('button-bottom-click');
		},
		touchend: function() {
			$(this).removeClass('button-bottom-click');
		}
	}, '.button-bottom');

	// process the config, and startup angular
	App.processConfig(config || App.config);
	App.AB.init();
	App.NGinit();

	// Remove the old cookies #1705
	$.cookie('loc','', { expires : ( new Date(1970,01,01) ) });
	$.cookie('locv2','', { expires : ( new Date(1970,01,01) ) });

	// #1774
	// @todo: this no longer seems to happen in ui2
	if (App.iOS() && !$('.is-ui2').get(0)){
		$(':input').focus( function() {
			$(window).scrollTop( $(window).scrollTop() + 1 );
		});
	}

	// show download page only if its ui2 in an ios browser
	if (App.iOS() && !App.isPhoneGap && !$.totalStorage('_viewmobile2') && $('.is-ui2').get(0)) {
		setTimeout(function(){
			App.go('/download');
		},10);
	}

	// Init the processor
	var processor = ( App.config.processor && App.config.processor.type ) ? App.config.processor.type : false;
	switch( processor ){
		case 'stripe':
			Stripe.setPublishableKey( App.config.processor.stripe );
			break;
		case 'balanced':
			break;
		default:
			console.log( 'Processor error::', App.config.processor );
			break;
	}

	window.addEventListener( 'pageshow', function(){
		// the first pageshow should be ignored
		if( App._firstPageShowHasHappened ){
			dateTime.reload();
		}
		App._firstPageShowHasHappened = true;
	}, false );

	// window.addEventListener( 'pagehide', function(){}, false );

	$(window).trigger('nginit');

	/*
	if (!App.isPhoneGap) {
		$(document).mousemove(function(e) {
			if ($('.parallax-bg').length) {
				console.log(e.pageX, e.pageY);
			}
		});
	}
	*/
};

App.handleUrl = function(url) {
	// only happens if being pased from a url in the native app

	var handler = 'crunchbutton://';

	if (!App.isPhoneGap || url.indexOf(handler) < 0) {
		return;
	}

	url = url.replace(handler, '');
	url = url.replace(/^\//,'');
	url = '/' + url;
	url = url.split('?');
	url = url[0];

	if (App._init) {
		// already launched. just nav
		App.go(url);
	} else {
		// launching with url params
		$(window).on('nginit', function() {
			App.go(url);
		});
	}
}


/**
 * dialog functions
 */
App.dialog = {
	show: function() {
		if (arguments[1]) {
			// its a title and message
			var src = '<div class="zoom-anim-dialog small-container">' +
				'<h1>' + arguments[0] + '</h1>' +
				'<div class="small-container-content">' + arguments[1] + '</div>' +
				'</div>';
		} else if ($(arguments[0]).length) {
			// its a dom selector
			var src = $(arguments[0]);

			// fix to prevent 2 dialogs from ever appearing. only show the second. #2919
			if (src.length > 1) {
				for (var x = 0; x < src.length - 1; x++) {
					src.get(x).remove();
				}
				var src = $(arguments[0]);
			}

		} else {
			console.log('ERROR WITH DIALOG',arguments);
			return;
		}

		$.magnificPopup.open({
			items: {
				src: src,
				type: 'inline'
			},
			fixedContentPos: true,
			fixedBgPos: true,
			closeBtnInside: true,
			preloader: false,
			midClick: true,
			removalDelay: 300,
			overflowY: 'auto',
			mainClass: 'my-mfp-zoom-in',
			callbacks: {
				open: function() {
					setTimeout(function() {
						if( App.iOS() ){
							// #1774
							var width = angular.element('.mfp-bg').width();
							angular.element('.mfp-bg').width( width + 10 );
						}
					},1);
				},
				close: function() {
					$('.wrapper').removeClass('dialog-open-effect-a dialog-open-effect-b dialog-open-effect-c dialog-open-effect-d');
					App.applyIOSPositionFix();
					App.rootScope.$broadcast( 'modalClosed' );
				}
			}
			//my-mfp-zoom-in
		});
	},
	isOpen : function(){
		return $.magnificPopup && $.magnificPopup.instance && $.magnificPopup.instance.isOpen;
	}
};


/**
 * play crunch audio sound
 */
App.playAudio = function(audio) {
	var path = (App.isPhoneGap ? '' : '/') + 'assets/audio/';
	var sound = new Howl({
		urls: [path + audio + '.mp3', path + audio + '.ogg']
	}).play();
}

App.vibrate = function() {
	if (App.isPhoneGap) {
		try {
			navigator.notification.vibrate(100);
		} catch (e) {}
	}
}

// Hack to fix iOS the problem with body position when the keyboard is shown #1774
App.applyIOSPositionFix = function(){
	// this seems to do more harm than good with ui2
	if ($('.is-ui2').get(0)) {
		return;
	}
	if( App.iOS() ){
		setTimeout( function(){
			angular.element('body').css('width', '+=1').css('width', '-=1');
			$('.navs').css('width','+=1').css('width','-=1');
			$('.navs').css('left', '+=1').css('left', '-=1');
			// Again to make sure it will really fix it!
			setTimeout( function(){
				angular.element('body').css('width', '+=1').css('width', '-=1');
				$('.navs').css('width','+=1').css('width','-=1');
				$('.navs').css('left', '+=1').css('left', '-=1');
			}, 300 );
		}, 200 );
	}
}

// Methods used by phoneGap
App.verifyConnection = {
	isOffLine: false,
	forceReload: false,
	init: function () {
		if (App.isPhoneGap) {
			App.verifyConnection.check( function( online ){
				var timer = ( online ) ? 3000 : ( 3500 );
				// hide splashscreen
				/*setTimeout( function(){
					if ( !App.splashHidden && navigator.splashscreen ) {
						App.splashHidden = true;
						navigator.splashscreen.hide();
					}
				}, timer );*/
			} );
		}
	},
	check: function ( callback ) {
		var networkState = navigator.connection.type;
		var online = true;
		if ( networkState == Connection.NONE ) {
			// If the app starts without internet, force reload it.
			App.verifyConnection.forceReload = true;
			App.verifyConnection.goOffline();
			online = false;
		}
		if( callback ){
			callback( online );
		}
	},
	goOffline: function () {
		if (App._remoteConfig) {
			return;
		}
		$('.connection-error').show();
		App.verifyConnection.isOffLine = true;
	},
	goOnline: function () {
		if (App.verifyConnection.isOffLine) {
			if (App.verifyConnection.forceReload) {
				window.location.reload(true);
				App.verifyConnection.forceReload = false;

			} else {
				App.rootScope.reload();
			}
		}
		App.verifyConnection.isOffLine = false;
		$('.connection-error').hide();
	}
}

App.setNotificationBarStatus = function( status ){
	App.rootScope.notificationBarStatus = status;
	App.rootScope.$safeApply();
}

// Phonegap events listeners
App.phoneGapListener = {
	init : function(){
		if( App.isPhoneGap ){
			document.addEventListener( 'deviceready', App.phoneGapListener.deviceready , false );
			document.addEventListener( 'pause', App.phoneGapListener.pause , false );
			document.addEventListener( 'resume', App.phoneGapListener.resume , false );
			document.addEventListener( 'online', App.phoneGapListener.online , false );
			document.addEventListener( 'offline', App.phoneGapListener.offline , false );
			if( !navigator.onLine ){
				App.phoneGapListener.offline();
			}
		}
	},
	deviceready : function(){
		// deviceready
	},
	resume : function(){
		dateTime.restart();
		App.rootScope.$broadcast( 'appResume', false );
	},
	pause : function(){
		// pause
	},
	online : function(){
		// online
		App.verifyConnection.goOnline();
	},
	offline: function(){
		// offline
		App.verifyConnection.goOffline();
	}
};

App.profile = {
	_timer:false,
	log: function(n) {
		// @debug: remove this return line to see the profile output
		return;
		var now = new Date();
		if (App.profile._timer) {
			console.debug('>> PROFILE',now.getTime() - App.profile._timer.getTime(),n);
		} else {
			console.debug('>> PROFILE',0,n);
		}
		App.profile._timer = now;
	}
}

App.share = function(params) {

	var pic = params.picture || 'http://crunchbutton.com/assets/images/facebook-like.png';

	if (App.isPhoneGap && App.iOS()) {
		var description = params.caption + ".\r\n" + params.description.replace(/(<br \/>)|(\n)/g,'');
		CDV.FB.share([params.url, params.name, '', description, pic], params.success, params.fail);

	} else {
		FB.ui({
			method: 'feed',
			user_message_prompt: 'Crunchbutton',
			link: params.url,
			href: params.url,
			picture: pic,
			name: params.name,
			caption:params.caption,
			description: params.description,
			attachment: {
				name: 'Crunchbutton',
				caption: ' ',
				description: params.url,
				href: params.url,
				media:[{
					type: 'image',
					src: pic,
					href: params.url
				}],
			},
			action_links: [{ text: 'Crunchbutton', href: 'https://crunchbutton.com' } ],
			description: params.description
		}, function(response) {
			console.log(response);
			if (response && response.post_id) {
				if (typeof params.success === 'function') {
					params.success(response);
				}
			} else {
				if (typeof params.fail === 'function') {
					params.fail(response);
				}
			}
		});
	}
}

App.isUI2 = function() {
	if (App._UI2IS) {
		return true;
	}
	if (App._UI2ISNT) {
		return false;
	}
	if ($('.is-ui2').get(0)) {
		return App._UI2IS = true;
	} else {
		return App._UI2ISNT = false;
	}
}