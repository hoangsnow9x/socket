io.sails.url = 'http://localhost:1337/';
var app = angular.module('myApp', []);

app.controller('myController', ['$http', '$scope' , function($http, $scope){
	console.log('This is controller');
	// event handle
	$('#main_chat').hide();
	setTimeout(function(){
		$('.color_red').hide();
	},2000);
	$(document).on('click', '.left li', function(){
		$('.left li').removeClass('active');
		$(this).addClass('active');
		$(this).find('.notification').hide();
	});

	// set variable

	// chatHistory = $()(".content");
	content = $(document).find('.content');
	new_msg = $('.new_msg');

	// get socket id
	io.socket.get('/getSocketID', function(res){
		socketId = res.data;
	});

	// client connect
	io.socket.on('connect', function onConnect(){
		console.log('Socket conneted');

	});

	// client listen list user online
  	io.socket.on('listonline', function(list){
		$scope.listOnline = list;
		content.scrollTop(content[0].scrollHeight);
		$scope.$apply();
	});

  	// client listen user login
	io.socket.on('user_logged_in', function(data){
		console.log(data);
		$scope.yourName = data.name;
		$scope.userId = data.id;
		// Logout
		$scope.Logout = function(){
			$('#isLogin').show(500);
			$('#main_chat').hide();
			io.socket.post('/logout', {name: data.name}, function(resData, jwres){
				window.location.reload();
				$scope.$apply();
			});
		}
		$scope.$apply();
	});

	// client listen message
	io.socket.on('get_all_msg', function(msg){
		console.log(msg);
		$scope.chatContent = msg;
		$scope.$apply();
	});

	// client listen list_rooms
	io.socket.on('list_rooms', function(rooms){
		console.log(rooms);
		var ul = $('.your_rooms ul');
		if(rooms){
			ul.html('');
			$.each(rooms, function(i,v){
				ul.append('<li><a class="room_item"  ng-name="'+v.roomName+'" ng-user="'+v.admin+'"><i class="fa fa-angle-double-right"></i>'+v.roomName+' <span class="notification">0</span></a></li>');
			});
		}
		$scope.$apply();
	});

	// event join room
		$(document).on('click', '.room_item', function(e) {
			var roomName = $(this).attr('ng-name'),
				input	 = $('#chat_user'),
				invite	 = $('.invite'),
				user 	 = $(this).attr('ng-user');

			console.log(roomName);
			$('#chat_user').removeAttr('data-friend');
			invite.html('');
			invite.append("<button class='btnInvite' data-room='"+roomName+"'>Member + </button>")
			content.html('');
			input.attr('data-room', roomName);
			io.socket.post('/join', {roomName: roomName, user: user}, function(resData, jwres){

			});
		});

		// client listen send_listchat_group
		io.socket.on('send_listchat_group', function(lists){
			console.log(lists);
			content.html('');
			$.each(lists.list_message, function(i,v){
				content.append('<p><b><i class="fa fa-user-secret"></i>'+v.user +':</b> <span>'+v.message+'</span></p>');
			});
			
			content.append('<div class="new_msg_'+lists.rid+'"></div>');
			content.append('<div class="user_join"></div>');
			
		});
		// client listen send_chat_group
		io.socket.on('send_chat_group', function(data){
			console.log(data);
			var div = $('.new_msg_'+ data.rid);
			div.append("<p><b><i class='fa fa-user-secret' ></i>"+data.message.user+" :</b> <span>"+data.message.message+"</span></p>").appendTo('.content');
		});


	// client listen new message
		io.socket.on('sendChat', function(msg){
			new_msg.append("<p><b><i class='fa fa-user-secret' ></i>"+msg.user+" :</b> <span>"+msg.message+"</span></p>").appendTo('.content');
	        content.scrollTop(content[0].scrollHeight);
		});
	
	// signup 
		$scope.signup = function(){
			io.socket.post('/signup', {name: $scope.username,pass: $scope.password}, function(resData, jwres){
				$scope.msg = resData.msg;
				$scope.$apply();
			});
		}

	// login to chat room
		$scope.login = function(){
			io.socket.post('/login', {name: $scope.username,pass: $scope.password}, function(resData, jwres){
				$scope.msg = resData.msg;
				if(resData.user){
					$('#main_chat').show(500);
					$('#isLogin').hide();
				}
				$scope.$apply();
			});
		}


	
	// send message
		$scope.sendChat = function(){
			var user = $('#chat_user'),
				friend = user.attr('data-friend'),
				roomName = user.attr('data-room');
			if($scope.chat_text != ""){
				if(roomName != undefined){
					io.socket.post('/sendChat', {message: $scope.chat_text, user: user.val(), roomName: roomName,}, function(resData, jwres){});
				}else if (friend != undefined){
					io.socket.post('/sendChat', {message: $scope.chat_text, user: user.val(),roomName: friend, friend: friend}, function(resData, jwres){});
				}
				else{
					io.socket.post('/sendChat', {message: $scope.chat_text, user: user.val()}, function(resData, jwres){});
				}
			}
		}

	//chat with user
		$scope.chat_with_user = function chat_with_user($event){

			var you = angular.element($event.target).attr('ng-name'),
				i = angular.element($event.target).attr('data-name'),
				invite = $('.invite'),
				input	 = $('#chat_user');
			invite.html('');
			content.html('');
			input.removeAttr('data-room');
			input.attr('data-friend', you);
			io.socket.post('/chat-user', {your_name: you, my_name: i}, function(){});
		}

		// client listen list_friend_chat
		io.socket.on('list_friend_chat', function(lists){
			console.log(lists);
			var rom = lists.roomName.replace(' ', '_');
			
			content.html('');
			$.each(lists.list_message, function(i,v){
				content.append('<p><b><i class="fa fa-user-secret"></i>'+v.user +':</b> <span>'+v.message+'</span></p>');
			});
			
			content.append('<div class="new_msg_'+rom+'"></div>');
			$scope.$apply();
		});

		io.socket.on('friend_chat', function(data){
			console.log(data);
			var div = $('.new_msg_'+ data.friend);
			div.append("<p><b><i class='fa fa-user-secret' ></i>"+data.user+" :</b> <span>"+data.message+"</span></p>").appendTo('.content');
			$scope.$apply();
		});

		io.socket.on('friend_chat1', function(data){
			var li = $(document).find('.left a');
			$.each(li, function(i,v){
				if(data.friend == $(this).attr('ng-name') && data.friend != $(this).attr('data-name')){
					var notification = $(this).find('.notification'),
						num 		 = notification.text();
					
					notification.html(parseInt(num)+1);
					notification.show();
				}
			});
			console.log(data);
			var div = $(document).find('.new_msg_'+ data.friend+":last");
			div.append("<p><b><i class='fa fa-user-secret' ></i>"+data.user+" :</b> <span>"+data.message+"</span></p>").appendTo('.content');
			$scope.$apply();
		});

	// create a room new
		var add_room = $('.add_room'),
			btnAddRoom = $('.btnAddRoom');
			add_room.hide();

		btnAddRoom.click(function(){
			btnAddRoom.hide();
			add_room.show();
		});

		$('.close_add_room').click(function(){
			add_room.hide();
			btnAddRoom.show();
		});

		$scope.add_room  = function($event){
			var elName 	 = angular.element($event.target).attr('ng-name'),
				roomName = $scope.roomName;
			if(roomName != undefined){
				add_room.hide();
				btnAddRoom.show();
				io.socket.post('/new_room', {roomName: roomName, Admin: elName}, function(resData, jwres){
					console.log(resData);
					if(resData){
						$('.your_rooms ul').append('<li ><a class="room_item" ng-name="'+resData.roomName+'" ng-user="'+elName+'"><i class="fa fa-angle-double-right"></i>'+resData.roomName+' <span class="notification">0</span></a></li>');
					}
				});
			}
		}
	// add member to room
		$(document).on('click', '.btnInvite', function(){
			var list = $('.list_invite'),
				roomName = $(this).attr('data-room');
				console.log(roomName);

			list.show();
			list.find('a').attr('data-room', roomName);
		});

		$(document).on('click', '.list_invite a', function(){
			var user 	 = $(this).attr('ng-name'),
				roomName = $(this).attr('data-room');

			io.socket.post('/invite', {user: user, roomName: roomName}, function(resData, jwres){
				console.log(resData);

			});
		});

		// client listen add_member_success
		io.socket.on('add_member_success', function(data){
			console.log(data);
			$('.user_join').append("<p>"+data+"</p>").appendTo('.content');
			$scope.$apply();
		});


	// event go chu
		$('.txtMessage').focusin(function(){
			console.log('dang go chu');

			var user 	= $('#chat_user'),
				room 	= user.attr('data-room'),
				val 	= user.val(),
				friend 	= user.attr('data-friend');
			if(room != undefined){
				io.socket.post('/enter-key', {roomName: room, user: val}, function(){
				});
				content.append("<p class='enter_key room_"+room.replace(' ', '_')+"'></p>").appendTo('.content');
			}else if( friend != undefined){
				io.socket.post('/enter-key', {friend: friend, user: val}, function(){
				});
				content.append("<p class='enter_key friend_"+friend+"'></p>").appendTo('.content');
			}
		}).focusout(function(){
			console.log('ngung go chu');
			$('.enter_key').remove();
		});

		io.socket.on('enter_key_in_room', function(data){
			console.log(data);
			var div = $('.room_'+ data.roomName.replace(' ', '_'));
			div.html(data.msg);
		});

		io.socket.on('enter_key_with_friend', function(data){
			console.log(data);
			var div = $('.friend_'+ data.friend);
			div.html(data.msg);
		})
	// disconnect
	io.socket.on('disconnect', function onDisconnect(){
      console.log('Lost connection to server');
  	});
}]);

