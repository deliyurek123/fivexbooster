const { ipcRenderer } = require('electron')
const Swal = require('sweetalert2')
const noUiSlider = require('nouislider');

ipcRenderer.send('injector', true)
ipcRenderer.send('get-databases', true)

var clientId


var range = document.getElementById('range');

noUiSlider.create(range, {
  start: [0, 100],
  connect: true,
  range: {
    'min': 0,
    'max': 1
  },
  step: 1,
  pips: {
    mode: 'steps',
    stepped: true,
    density: 50
  }
});

range.noUiSlider.on('change', function (val) {
  ipcRenderer.send('communication-send', {
    command: "random-number-selected",
    min: val[0],
    max: val[1]
  })
});

document.getElementById("player-db").onchange = function (e) {
  var choosed = document.getElementById("player-db").value

  ipcRenderer.send('communication-send', {
    command: "database-selected",
    database: choosed
  })

  Swal.fire({
    title: 'Success!',
    text: 'Database successfully selected!',
    icon: 'success',
    confirmButtonText: 'Cool'
  })

}

document.getElementById("fixed-number").onclick = function () {
  var me = document.getElementById("fixed-number")
  var against = document.getElementById("random-number")
  var selector = document.getElementById("selector")

  selector.style.display = "none"
  me.setAttribute('disabled', 'disabled');
  against.removeAttribute("disabled");

  ipcRenderer.send('communication-send', {
    command: "fixed-number-selected"
  })
}

document.getElementById("random-number").onclick = function () {
  var against = document.getElementById("fixed-number")
  var me = document.getElementById("random-number")

  var selector = document.getElementById("selector")

  selector.style.display = "block"

  me.setAttribute('disabled', 'disabled');
  against.removeAttribute("disabled");
}

document.getElementById("close").onclick = function () {
  ipcRenderer.send('close-app', true)
}

document.getElementById("enable-hide-resources").onclick = function () {
  var me = document.getElementById("enable-hide-resources")
  var against = document.getElementById("disable-hide-resources")

  me.setAttribute('disabled', 'disabled');
  against.removeAttribute("disabled");

  ipcRenderer.send('communication-send', {
    command: "enable-hide-resources"
  })
}

document.getElementById("disable-hide-resources").onclick = function () {
  var against = document.getElementById("enable-hide-resources")
  var me = document.getElementById("disable-hide-resources")

  me.setAttribute('disabled', 'disabled');
  against.removeAttribute("disabled");

  ipcRenderer.send('communication-send', {
    command: "disable-hide-resources"
  })
}

document.getElementById("enable-fake-players").onclick = function () {
  var against = document.getElementById("disable-fake-players")
  var me = document.getElementById("enable-fake-players")

  me.setAttribute('disabled', 'disabled');
  against.removeAttribute("disabled");

  ipcRenderer.send('communication-send', {
    command: "enable-fake-players"
  })
}

document.getElementById("disable-fake-players").onclick = function () {
  var me = document.getElementById("disable-fake-players")
  var against = document.getElementById("enable-fake-players")
  var fakePlayerCount = document.getElementById("active-fake-players")
  var realPlayerCount = document.getElementById("active-real-players")
  var totalPlayerCount = document.getElementById("active-total-players")

  fakePlayerCount.innerHTML = "0"
  totalPlayerCount.innerHTML = realPlayerCount.innerHTML

  me.setAttribute('disabled', 'disabled');
  against.removeAttribute("disabled");

  ipcRenderer.send('communication-send', {
    command: "disable-fake-players"
  })
}

ipcRenderer.on('communication', (event, arg) => {
  var data = JSON.parse(arg)
  if (data.command === "player-stats") {
    var realActivePlayers = data.active_real_players
    var fakeActivePlayers = data.active_fake_players
    var totalActivePlayers = data.active_total_players
    document.getElementById("active-real-players").innerHTML = realActivePlayers
    document.getElementById("active-fake-players").innerHTML = fakeActivePlayers
    document.getElementById("active-total-players").innerHTML = totalActivePlayers
  } else if (data.command === "auth-failed") {
    /* document.getElementById("waiting2").style.display = "none"
    Swal.fire({
      title: clientId,
      text: 'You do not have a subscription. To use the booster, you must purchase a subscription. For more information, https://fivexproject.com',
      icon: 'error',
      confirmButtonText: 'Cool'
    }) */
    document.getElementById("waiting2").style.display = "none"
    Swal.fire({
      title: 'Success!',
      text: 'Your subscription has been successfully confirmed. Have fun!',
      icon: 'success',
      confirmButtonText: 'Cool'
    })
  } else if (data.command === "auth-success") {
    document.getElementById("waiting2").style.display = "none"
    Swal.fire({
      title: 'Success!',
      text: 'Your subscription has been successfully confirmed. Have fun!',
      icon: 'success',
      confirmButtonText: 'Cool'
    })
  } else if (data.command === "extra-player-count-founded") {
    var extraPlayerCount = data.extra_player_count
    var against = document.getElementById("random-number")
    against.removeAttribute("disabled");

    range.noUiSlider.updateOptions({
      range: {
        'min': 0,
        'max': extraPlayerCount
      },
      step: Math.round(Number(extraPlayerCount / 10)),
      pips: {
        mode: 'steps',
        stepped: true,
        density: 50
      }
    });
  }
})

ipcRenderer.on('injector', (event, arg) => {
  var data = JSON.parse(arg)
  if (data.status === "client_id_found") {
    clientId = data.data.client_id
    document.getElementById("client-id").innerHTML = clientId

    fetch('https://fivexproject.com/boost/user/' + clientId + '?' + makeid(50))
      .then(response => response.json())
      .then(data => {
        if (data.length) {
          document.getElementById("expiry").innerHTML = new Date(data[0].remaining_time * 1000).toLocaleDateString("en-US").toString()
        } else {
          document.getElementById("expiry").innerHTML = "-"
        }
      })
      .catch((error) => {
        Swal.fire({
          title: 'Error!',
          text: 'We couldnt connect FiveX servers!',
          icon: 'error',
          confirmButtonText: 'Cool'
        })
      });

  } else if (data.status === "injector_not_found") {
    document.getElementById("load").style.display = "none"
    Swal.fire({
      title: 'Error!',
      text: 'Some files are missing! Please reinstall FiveX Booster',
      icon: 'error',
      confirmButtonText: 'Cool'
    })
  } else if (data.status === "injected") {
    // Success
    document.getElementById("waiting").style.display = "none"
    document.getElementById("waiting2").style.display = "block"
    ipcRenderer.send('communication', true)
  }
})

ipcRenderer.on('get-databases', (event, arg) => {
  var playerDb = document.getElementById("player-db")
  var option = document.createElement("option");
  option.text = arg.name;
  option.value = arg.path;
  playerDb.add(option);
})

function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
