App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  //first we will initialize our app
  //and also will initialize "web3"
  init:function(){
    return App.initWeb3();
  },

  //Basically web3 connect our client side application with our local block chain
  initWeb3:function(){
    if(typeof web3 !== 'undefined'){
      // If a web3 instance is already provided by metamask
      //->Basically meta mask will help us to make a regular browser with blockchain browser
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    }else{
      //Or else we will manually specify the web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider("http://127.0.0.1:8545");
      web3 = new Web3(App.web3Provider);
    }
    //once that is finished we will initalize our contract
    return App.initContract();//<== initialization o the contract
  },

  //once web3 is initialized we will initialize our contract(Solidity)
  //So Basically it loads up our contract so as we can view it..
   initContract: function(){

    //First we will get the json file of our election contract
    /*
        IMPORTANT NOTE THIS GETJSON WILL BE WORKING BEACAUSE OF BS-CONFIG.JSON THAT CAME WHEN WE INSTALL TRUFFLE 
        THIS JSON FILE WILL BE AVAILABLE FROM THE build/contracts/Election.json
    */

    $.getJSON("Election.json",function(election){
      //Instance of new truffle contract will be initialzed
      /*
        **
        *TruffleContract is the contract that we can use in order or Communicate with our app
        **
      */
      App.contracts.Election = TruffleContract(election);//<<==THEN WE USE THIS JSON FILE TO INITALIZE OUR CONTRACT
      //Connection provider to interact with the contract
      App.contracts.Election.setProvider(App.web3Provider);//<<== THEN WE WILL SET THE PROVIDER FOR OUR CONTRACT THAT WE INITALIED EARLIER
      
      App.listenForEvents();

      //WE WILL then render these things in our html or JSP pages
      return App.render();
    });
  },

  listenForEvents:function(){
    App.contracts.Election.deployed().then(function(instance){
        instance.votedEvent({},{
          fromBlock:0,
          toBlock:'latest'
        }).watch(function(error,result){
          console.log("Event triggered")
          App.render();
        }); 
    });
  },

  //Basically it will render out the information on the contrac t
  render:function(){
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();
    
    //It will basically load the function 
    //Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });
    //Load contract d ata
    App.contracts.Election.deployed().then(function(instance) {
      electionInstance = instance;
      return electionInstance.candidatesCount();
    }).then(function(candidatesCount) {
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      var candidatesSelect = $("#candidateSelect");
      candidatesSelect.empty();


      for (var i = 1; i <= candidatesCount; i++) {
        electionInstance.candidates(i).then(function(candidate) {
          var id = candidate[0];
          var name = candidate[1];
          var voteCount = candidate[2];

          // Render candidate Result
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
          candidatesResults.append(candidateTemplate);

          // Render candidate ballot option
          var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
          candidatesSelect.append(candidateOption);
        });
      }
      return electionInstance.voters(App.account);
      }).then(function(hasVoted) {
      // Do not allow a user to vote
      if(hasVoted) {
        $('form').hide();
      }
      loader.hide();
      content.show();
    }).catch(function(error){
      console.warn(error);
    });
  },

  //Basically this is the function wihchc will be executed on submit button click
  castVote: function() {
    var candidateId = $('#candidateSelect').val();
    App.contracts.Election.deployed().then(function(instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  }
  
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});