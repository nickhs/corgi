window.addEvent('domready', function() {
  cm = new CasesManager();
  site = new Site();
  ws_manager = new WebsocketManager();
  new Brad();
});

var CasesManager = new Class({
  Implements: Events,

  template: [
    '<div class="mail-icon">',
    '</div>',
    '<div>',
      '<div class="title">',
        '<p>{title}</p>',
      '</div>',
      '<div class="message">',
        '<p>{message}</p>',
      '</div>',
      '<div class="bottom">',
        '<span class="when">{when}</span><span class="id">{id}</span>',
      '</div>',
    '</div>'
  ],

  initialize: function() {
    console.log('init case manager');
    this.spine = $$('.cases ul')[0];

    this.timechange = setInterval(function() {
      this.changeTimes();
    }.bind(this), 60000);
  },

  addCases: function(data) {
    console.log("Adding cases", data);

    if (data.cases.length === 0) {
      return;
    }

    var tplt = this.template.join('');

    var existing_cases = this.spine.getChildren();
    var cases = data.cases;

    if (existing_cases.length === 0) {
      new_cases = cases;
    } else {
      var top_case = existing_cases[0].get('data-id');
      console.log('top case', top_case);
      for (var i = 0; i < cases.length; i++) {
        console.log('cur case', cases[i].id);
        if (top_case == cases[i].id) {
          console.log("MATCH FOUND", i);
          new_cases = cases.slice(i+1);
          console.log("New cases", new_cases);
        }
      }
    }

    new_cases.each(function(item, idx) {
      var model = {
        title: item.subject,
        message: item.preview,
        when: this.findRelativeTime(item.date),
        id: item.id
      };

      var el = new Element('li', {
        'class': 'item',
        'data-id': item.id,
        'data-time': item.date,
        html: tplt.substitute(model)
      });

      el.inject(this.spine, 'top');
    }.bind(this));
  },

  findRelativeTime: function(time) {
    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;

    var elapsed = Date.now() - Date.parse(time);

    if (elapsed < msPerMinute) {
         return Math.round(elapsed/1000) + ' seconds ago';
    }

    else if (elapsed < msPerHour) {
         return Math.round(elapsed/msPerMinute) + ' minutes ago';
    }

    else {
         return Math.round(elapsed/msPerHour ) + ' hours ago';
    }
  },

  changeCaseCount: function(count) {
    console.log("Changing count", count);
    $$('.open-cases span')[0].set('text', count.count);
    this.fireEvent('count', count.count);
  },

  changeTimes: function() {
    console.log("changing times");
    var children = this.spine.getChildren();
    children = children.slice(0, 10);
    children.each(function(child, idx) {
      time = child.get('data-time');
      var new_time = this.findRelativeTime(time);
      child.getElementsByClassName('when')[0].set('text', new_time);
    }, this);
  }
});

var WebsocketManager = new Class({
  initialize: function() {
   this.socket = io.connect('http://localhost');
   this.socket.on('new_items', cm.addCases.bind(cm));
   this.socket.on('count', cm.changeCaseCount.bind(cm));
   this.socket.on('kiip', site.changeStatus.bind(site));
  }
});

var Brad = new Class({
  initialize: function() {
    this.brad_element = $$('.statuses').getChildren()[0][2].getElement('span');
    cm.addEvent('count', this.countChanged.bind(this));
  },

  countChanged: function(count) {
    console.log("EVENT FIRED");
    if (count > 15) {
      this.bradIsUpset();
    } else if (count > 5) {
      this.bradIsMoody();
    } else {
      this.bradIsHappy();
    }
  },

  bradIsUpset: function() {
    this.bradChange('upset', 'status-fail');
  },

  bradIsMoody: function() {
    this.bradChange('moody', 'status-unknown');
  },

  bradIsHappy: function() {
    this.bradChange('happy', 'status-success');
  },

  bradChange: function(message, status) {
    this.brad_element.removeClass('status-success');
    this.brad_element.removeClass('status-unknown');
    this.brad_element.removeClass('status-fail');

    this.brad_element.addClass(status);
    this.brad_element.set('text', message);
  }
});

var Site = new Class({
  initialize: function() {
    this.site_element = $$('.statuses').getChildren()[0][0].getElement('span');
  },

  changeStatus: function(resp) {
    console.log('changeStatus', resp);
    if (resp == 'success') {
      this.success();
    } else if (resp == 'timed') {
      this.timeout();
    } else if (resp == 'failed') {
      this.failure();
    } else {
      this.unknown(resp);
    }
  },

  success: function() {
    this.statusChange('up', 'status-success');
  },

  failure: function() {
    this.statusChange('down', 'status-fail');
  },

  timeout: function() {
    this.statusChange('timed out', 'status-fail');
  },

  unknown: function(message) {
    this.statusChange(message, 'status-unknown');
  },

  statusChange: function(message, status) {
    this.site_element.removeClass('status-success');
    this.site_element.removeClass('status-unknown');
    this.site_element.removeClass('status-fail');

    this.site_element.addClass(status);
    this.site_element.set('text', message);
  }
});
