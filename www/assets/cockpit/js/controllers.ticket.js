NGApp.config(['$routeProvider', function($routeProvider) {
	$routeProvider
		.when('/tickets', {
			action: 'tickets',
			controller: 'TicketsCtrl',
			templateUrl: 'assets/view/tickets.html',
			reloadOnSearch: false

		}).when('/ticket/:id', {
			action: 'ticket',
			controller: 'TicketCtrl',
			templateUrl: 'assets/view/tickets-ticket.html'
		});
}]);

NGApp.controller('TicketsCtrl', function ($rootScope, $scope, TicketService, ViewListService) {
	$rootScope.title = 'Tickets';

	angular.extend($scope, ViewListService);

	$scope.view({
		scope: $scope,
		watch: {
			search: '',
			status: 'open',
			admin: 'all'
		},
		update: function() {
			TicketService.list($scope.query, function(d) {
				$scope.lotsoftickets = d.results;
				$scope.complete(d);
			});
		}
	});
});


NGApp.controller('TicketCtrl', function($scope, $rootScope, $interval, $routeParams, OrderService, TicketService, MapService, SocketService) {

	$rootScope.title = 'Ticket #' + $routeParams.id;
	$scope.loading = true;

	SocketService.listen('ticket.' + $routeParams.id, $scope).on('update', function(d) { update(); });


	$scope.isRefunding = false;

	$scope.refund = function(){

		if( $scope.isRefunding ){
			return;
		}

		var question = 'Are you sure you want to refund this order?';
		if( parseFloat( $scope.ticket.order.credit ) > 0 ){
			question += "\n";
			question += 'A gift card was used at this order the refund value will be $' + $scope.ticket.order.charged + ' + $' + $scope.ticket.order.credit + ' as gift card.' ;
		}

		if ( confirm( question ) ){

			$scope.isRefunding = true;
			OrderService.refund( $scope.ticket.order.id_order, function( result ){

				$scope.isRefunding = false;

				if( result.success ){
					$rootScope.reload();
				} else {
					console.log( result.responseText );
					var er = result.errors ? "<br>" + result.errors : 'See the console.log!';
					App.alert('Refunding fail! ' + er);
				}
			} );
		}
	}

	$scope.do_not_pay_driver = function(){
		OrderService.do_not_pay_driver( $scope.ticket.order.id_order, function( result ){
			if( result.success ){
				$scope.flash.setMessage( 'Saved!' );
				$scope.ticket.order.do_not_pay_driver = ( $scope.ticket.order.do_not_pay_driver ? 0 : 1 );
			} else {
				$scope.flash.setMessage( 'Error!' );
			}
		} );
	}

	$scope.do_not_pay_restaurant = function(){
		OrderService.do_not_pay_restaurant( $scope.ticket.order.id_order, function( result ){
			if( result.success ){
				$scope.flash.setMessage( 'Saved!' );
				$scope.ticket.order.do_not_pay_restaurant = ( $scope.ticket.order.do_not_pay_restaurant ? 0 : 1 );
			} else {
				$scope.flash.setMessage( 'Error!' );
			}
		} );
	}

	$scope.do_not_reimburse_driver = function(){
		OrderService.do_not_reimburse_driver( $scope.ticket.order.id_order, function( result ){
			if( result.success ){
				$scope.flash.setMessage( 'Saved!' );
				$scope.ticket.order.do_not_reimburse_driver = ( $scope.ticket.order.do_not_reimburse_driver ? 0 : 1 );
			} else {
				$scope.flash.setMessage( 'Error!' );
			}
		} );
	}

	$scope.isCommentSaving = false;

	var saveComment = function( close ){
		if( close && $scope.ticket.status != 'open' ){
			return;
		}
		if( $scope.comment_text ){
			$scope.isCommentSaving = true;
			TicketService.message( { 'id_support': $routeParams.id, 'body': $scope.comment_text, 'note': true }, function(){
				$scope.comment_text = '';
				$scope.isCommentSaving = false;
				if( close ){
					if( $scope.ticket.status == 'open' ){
						$scope.openCloseTicket();
					}
				} else {
					update();
				}
			} );
		} else {
			App.alert( 'Please type something!' );
		}
	}

	$scope.comment = function(){
		saveComment( false );
	}

	$scope.close_and_comment = function(){
		saveComment( true );
	}

	var cleanup;

	var draw = function() {
		if (!$scope.map || !$scope.ticket) {
			return;
		}

		MapService.trackOrder({
			map: $scope.map,
			order: $scope.ticket.order,
			restaurant: {
				location_lat: $scope.ticket.order._restaurant_lat,
				location_lon: $scope.ticket.order._restaurant_lon
			},
			driver: $scope.ticket.order.driver,
			id: 'ticket-driver-location',
			scope: $scope
		});
	};

	var update = function() {
		TicketService.get($routeParams.id, function(ticket) {
			$scope.ticket = ticket;
			$scope.loading = false;

			if (!cleanup) {
				if( ticket && ticket.order ){
					cleanup = $rootScope.$on('order-route-' + ticket.order.id_order, function(event, args) {
						$scope.$apply(function() {
							$scope.eta = args;
						});
						console.debug('Got route update: ', args);
					});
				}
			}
			draw();
		});
	};

	$scope.openCloseTicket = function(){
		TicketService.openClose( $routeParams.id, function() { update(); } );
	}

	$scope.$on('mapInitialized', function(event, map) {
		$scope.map = map;
		MapService.style(map);
		draw();
	});

	update();

	$rootScope.$broadcast('triggerViewTicket', $routeParams.id);

});