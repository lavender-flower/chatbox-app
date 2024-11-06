var app = angular.module('myApp', [])

// Controller to handle user data on homepage
app.controller('HomeController', function ($scope, $http) {
  // Fetch logged-in user data from the backend
  $http
    .get('http://localhost:3000/api/user')
    .then(function (response) {
      // Store user data in the scope
      $scope.loggedInUser = response.data.user
      $scope.otherUsers = response.data.otherUsers
    })
    .catch(function (error) {
      console.error('Error fetching user data:', error)
    })
})
