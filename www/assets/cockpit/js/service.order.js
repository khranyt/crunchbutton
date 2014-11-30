
NGApp.factory('OrderService', function(ResourceFactory, $rootScope) {

	var service = {};

	var order = ResourceFactory.createResource(App.service + 'orders/:id_order', { id_order: '@id_order'}, {
		'load' : {
			url: App.service + 'order/:id_order',
			method: 'GET',
			params : {}
		},
		'save' : {
			url: App.service + 'order/:id_order',
			method: 'POST',
			params : {}
		},
		'saveeta' : {
			url: App.service + 'order/:id_order/eta',
			method: 'POST',
			params : {}
		},
		'eta' : {
			url: App.service + 'order/:id_order/eta',
			method: 'GET',
			params : {}
		},
		'query' : {
			method: 'GET',
			params : {}
		}
	});

	service.list = function(params, callback) {
		order.query(params).$promise.then(function success(data, responseHeaders) {
			callback(data);
		});
	}

	service.get = function(id_order, callback) {
		order.load({id_order: id_order}, function(data) {
			callback(data);
		});
	}
	
	service.post = function(params, callback) {
		order.save(params, function(data) {
			callback(data);
		});
	}
	
	service.saveeta = function(params, callback) {
		order.saveeta(params, function(data) {
			callback(data);
		});
	}

	$rootScope.$on('order-route', function(event, args) {

		var eta = {
			time: 0,
			distance: 0
		};
		for (var x in args.legs) {
			eta.time += args.legs[x].duration.value/60;
			eta.distance += args.legs[x].distance.value * 0.000621371;
		}
		
		if (args.order.status.status == 'accepted' ||args.order.status.status == 'transferred') {
			if (args.restaurant.formal_relationship == 1 || args.restaurant.order_notifications_sent) {
				eta.time += 5;
			} else {
				eta.time += 15;
			}
		}
		
		service.saveeta({
			id_order: args.order.id_order,
			time: eta.time,
			distance: eta.distance,
			method: 'google-route-js'
		}, function(){});
		
		$rootScope.$broadcast('order-route-' + args.order.id_order, eta);
	});

	return service;

});