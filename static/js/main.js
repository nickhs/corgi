window.addEvent('domready', function() {
  var cm = new CasesManager();
  var corgi_client = new CorgiClient();
});

var CasesManager = new Class({
  Implements: Events,
  url: '/cases',
  refresh: 3000,

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

    if (!this.req) {
      this.req = new Request({
        url: this.url,
        onSuccess: this.success.bind(this),
        onFailure: this.failure.bind(this),
        onError: this.failure.bind(this)
      });
    }

    this.req.get();

    this.intv = setInterval(function() {
      this.req.get();
    }.bind(this), this.refresh);
  },

  success: function(resp) {
    var json = JSON.parse(resp);
    var cases = json.cases;
    this.changeCaseCount(cases.length);
    var tplt = this.template.join('');

    var new_items = [];
    if (this.spine.getChildren().length === 0) {
      new_items = cases;
    } else {
      this.spine.getChildren()[0].get('data-id');

      for (var i = 0; i > cases.length; i++) {
        if (child_id == cases[i].id) {
          new_items = cases.slice(0, i-1);
          break;
        }
      }
    }

    console.log(new_items);

    new_items.each(function(item, idx) {
      var model = {
        title: item.subject,
        message: item.preview,
        when: this.findRelativeTime(item.date),
        id: item.id
      };

      var el = new Element('li', {
        'class': 'item',
        'data-id': item.id,
        html: tplt.substitute(model)
      });

      el.inject(this.spine, 'top');
    }.bind(this));
  },

  failure: function(resp) {
    console.log("FAILURE", resp);
    this.fireEvent("FAILURE");
  },

  findRelativeTime: function(time) {
    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;

    var elapsed = Date.now() - Date.parse(time);
    console.log(elapsed);

    if (elapsed < msPerMinute) {
         return Math.round(elapsed/1000) + ' seconds ago';
    }

    else if (elapsed < msPerHour) {
         return Math.round(elapsed/msPerMinute) + ' minutes ago';
    }

    else if (elapsed < msPerDay ) {
         return Math.round(elapsed/msPerHour ) + ' hours ago';
    }
  },

  changeCaseCount: function(count) {
    $$('.open-cases span')[0].set('text', count);
  }
});

