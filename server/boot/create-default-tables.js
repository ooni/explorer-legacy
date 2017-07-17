var async = require('async');
module.exports = function(app) {
  var ds = app.dataSources.db;

  async.series([
      createNettestRows,
      createCensorshipMethods,
      createCountryRows
  ], function(err, result) {
    if (err) { console.log(err);return }
    console.log("Mapping method to country");
    mapMethodToCountry(function(err, result) {
      if (err) { console.log(err);return }
      console.log("Mapping done");
    });
  });

  function createCountryRows(cb) {
    var country_rows = [];
    var countries = require('country-data').countries;
    countries.all.forEach(function(country, idx) {
        if (country.alpha2 === 'TW') {
            country.name = 'Taiwan';
        }
        country_rows.push({
            'iso_alpha2': country.alpha2,
            'iso_alpha3': country.alpha3,
            'name': country.name,
            'id': idx
        });
    });
    console.log('Inserting country data');
    ds.automigrate('country', function(err) {
      if (err) return cb(err);
      console.log('Automigrated country data');
      app.models.country.create(country_rows, cb);
    });
  }

  function mapMethodToCountry(cb) {
    var dns_hijacking = 1;
    var http_proxy = 2;
    var tcp_ip = 3;

    var methodsByCountry = {
        'TR': [dns_hijacking],
        'IR': [dns_hijacking,http_proxy],
        'SA': [http_proxy],
        'ID': [http_proxy],
        'CN': [dns_hijacking,tcp_ip],
        'RU': [http_proxy],
        'GR': [dns_hijacking,http_proxy]
    }

    /* This horror of spaghetti code is the result of many hours of debugging loopback and trying to decipher it's cryptic error messages just so that I could write 2 integers inside of a table.
     * This is not what a ORM is supposed to do.
     * I am not going to fix this.
     * */
    async.mapValues(methodsByCountry, function(methods, iso_alpha2, cb2) {
        console.log("" + iso_alpha2 + "->" + methods);
      app.models.country.findOne({'where': {'iso_alpha2': iso_alpha2}}, function(err, country) {
        if (err) {console.log(err); return cb2(err)}
        async.map(methods, function(methodId) {
            app.models.censorship_method.findById(methodId, function(err, method) {
                country.censorship_methods.add(method);
            });
        }, function(err, results) {
              if (err) return cb2(err);
              cb2(null, results);
        })
      });
    }, function(err, results) {
        if (err) {return cb(err)}
        cb(null, results);
    });
  }

  function createCensorshipMethods(cb) {
      var methods = [{
          'id': 1,
          'name': 'DNS hijacking',
          'description': 'DNS hijacking involves sending falsified DNS query responses to requests sent by clients'
      },{
          'id': 2,
          'name': 'Transparent HTTP proxy',
          'description': 'A transparent HTTP proxy is a middle box that will intercept the requests of users and either block them or display an error message'
      },{
          'id': 3,
          'name': 'TCP/IP blocking',
          'description': 'TCP/IP based blocking is blocking or impeding the ability of a client to connect to the server'
      }];
      ds.automigrate(['censorship_method', 'countrycensorship_method'], function(err) {
          if (err) return cb(err);
          console.log('Automigrated censorship methods');
          app.models.censorship_method.create(methods, cb);
      });
  }

  function createNettestRows(cb) {
      var nettest_rows = [
      {
          'name': 'bridget',
          'long_name': 'BridgeT',
          'description': 'Test to measure reachability of Tor bridges.',
          'spec_url': 'https://github.com/TheTorProject/ooni-spec/blob/master/test-specs/ts-001-bridget.md'
      },
      {
          'name': 'dns_consistency',
          'long_name': 'DNS consistency',
          'description': 'Test to measure consistency amongst DNS responses from a set of test resolvers and a control resolver.',
          'spec_url': 'https://github.com/TheTorProject/ooni-spec/blob/master/test-specs/ts-002-dnsconsistency.md'
      },
      {
          'name': 'http_requests',
          'long_name': 'HTTP requests',
          'description': 'Test to compare HTTP GET request responses from a control and experiment vantage point.',
          'spec_url': 'https://github.com/TheTorProject/ooni-spec/blob/master/test-specs/ts-003-http-requests.md'
      },

      {
          'name': 'http_host',
          'long_name': 'HTTP host',
          'description': 'Test to identify the presence of a transparent HTTP proxy and verify if certain censorship evasion technique will work against it.',
          'spec_url': 'https://github.com/TheTorProject/ooni-spec/blob/master/test-specs/ts-004-httphost.md'
      },
      {
          'name': 'dns_spoof',
          'long_name': 'DNS spoof',
          'description': 'Test to determine if DNS censorship is happening by means of DNS spoofing.',
          'spec_url': 'https://github.com/TheTorProject/ooni-spec/blob/master/test-specs/ts-005-dnsspoof.md'
      },
      {
          'name': 'http_header_field_manipulation',
          'long_name': 'HTTP header field manipulation',
          'description': 'Test to verify if the HTTP headers sent by the client are being altered when transmitted to the control backend.',
          'spec_url': 'https://github.com/TheTorProject/ooni-spec/blob/master/test-specs/ts-006-header-field-manipulation.md'
      },
      {
          'name': 'http_invalid_request_line',
          'long_name': 'HTTP invalid request line',
          'description': 'Sends invalid HTTP request lines in the attempt to trigger error responses from transparent HTTP proxies.',
          'spec_url': 'https://github.com/TheTorProject/ooni-spec/blob/master/test-specs/ts-007-http-invalid-request-line.md'
      },
      {
          'name': 'tcp_connect',
          'long_name': 'TCP connect',
          'description': 'Performs a TCP handshake with the endpoint.',
          'spec_url': 'https://github.com/TheTorProject/ooni-spec/blob/master/test-specs/ts-008-tcpconnect.md'
      },
      {
          'name': 'multi_protocol_traceroute',
          'long_name': 'Multi protocol traceroute',
          'description': 'Performs a ICMP, TCP and UDP traceroute with varying destination ports in an attempt to spot traceroute path biases.',
          'spec_url': 'https://github.com/TheTorProject/ooni-spec/blob/master/test-specs/ts-009-multi-port-traceroute.md'
      },
      {
          'name': 'captive_portal',
          'long_name': 'Captive portal',
          'description': 'Attempts to detect the presence of a captive portal',
          'spec_url': 'https://github.com/TheTorProject/ooni-spec/blob/master/test-specs/ts-010-captive-portal.md'
      },
      {
          'name': 'bridge_reachability',
          'long_name': 'Bridge reachability',
          'description': 'Tests accessibility of Tor bridges.',
          'spec_url': 'https://github.com/TheTorProject/ooni-spec/blob/master/test-specs/ts-011-bridge-reachability.md'
      },
      {
          'name': 'dns_injection',
          'long_name': 'DNS injection',
          'description': 'Tests to see if the answers to DNS queries for particular hostnames are being injected or spoofed',
          'spec_url': 'https://github.com/TheTorProject/ooni-spec/blob/master/test-specs/ts-012-dns-injection.md'
      },
      {
          'name': 'lantern_circumvention_tool_test',
          'long_name': 'Lantern',
          'description': 'Tests to see if the censorship circumvention tool lantern works.',
          'spec_url': 'https://github.com/TheTorProject/ooni-spec/blob/master/test-specs/ts-012-lantern.md'
      },
      {
          'name': 'meek_fronted_requests_test',
          'long_name': 'Meek fronted requests',
          'description': 'Tests the meek cloudfronted frontend to verify accessibility',
          'spec_url': 'https://github.com/TheTorProject/ooni-spec/blob/master/test-specs/ts-013-meek-fronted-requests.md'
      },

      {
          'name': 'psiphon_test',
          'long_name': 'Psiphon',
          'description': 'Tests to see if the censorship circumvention tool psiphon works.',
          'spec_url': 'https://github.com/TheTorProject/ooni-spec/blob/master/test-specs/ts-014-psiphon.md'
      },
      {
          'name': 'openvpn',
          'long_name': 'OpenVPN',
          'description': 'Tests to see if the openvpn client works with a set of openvpn endpoints',
          'spec_url': 'https://github.com/TheTorProject/ooni-spec/blob/master/test-specs/ts-015-openvpn.md'
      },
      {
          'name': 'vanilla_tor',
          'long_name': 'Vanilla Tor',
          'description': 'Test to see if tor with no bridges works',
          'spec_url': 'https://github.com/TheTorProject/ooni-spec/blob/master/test-specs/ts-016-vanilla-tor.md'
      },
      {
          'name': 'web_connectivity',
          'long_name': 'Web Connectivity',
          'description': 'Examines whether access to websites is blocked through DNS tampering, TCP or IP blocking, or by a transparent HTTP proxy',
          'spec_url': 'https://github.com/TheTorProject/ooni-spec/blob/master/test-specs/ts-017-web-connectivity.md'
      },
      {
          'name': 'whatsapp',
          'long_name': 'WhatsApp',
          'description': 'Checks to see if WhatsApp is working',
          'spec_url': 'https://github.com/TheTorProject/ooni-spec/blob/master/test-specs/ts-018-whatsapp.md'
      },
      {
          'name': 'facebook_messenger',
          'long_name': 'Facebook Messenger',
          'description': 'Checks to see if Facebook Messenger is working',
          'spec_url': 'https://github.com/TheTorProject/ooni-spec/blob/master/test-specs/ts-019-facebook-messenger.md'
      },
          'name': 'telegram',
          'long_name': 'Telegram',
          'description': 'Checks to see if Telegram is working',
          'spec_url': 'https://github.com/TheTorProject/ooni-spec/blob/master/test-specs/ts-020-telegram.md'
      },

      ];
      console.log('Inserting nettest data');
      ds.automigrate('nettest', function(err) {
        if (err) return cb(err);
        console.log('Automigrated nettest data');
        app.models.nettest.create(nettest_rows, cb);
      });
  }

}
