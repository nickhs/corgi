window.addEvent('domready', function() {
  cm = new CasesManager();
  ws_manager = new WebsocketManager();
});

var CasesManager = new Class({
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
  }
});
