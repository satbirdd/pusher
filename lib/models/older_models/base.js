var redis       = require('redis'),
    fs          = require('fs'),
    poolModule  = require('generic-pool'),
    db_filename = './database.json';

var db = JSON.parse(fs.readFileSync(db_filename));

var pool = poolModule.Pool({
    name     : 'redis',
    create   : function(callback) {

        var client  = redis.createClient(db.port, db.host);
        // parameter order: err, resource
        // new in 1.0.6
        callback(null, client);
    },
    destroy  : function(client) { client.end(); },
    max      : 10,
    // optional. if you set this, make sure to drain() (see step 3)
    min      : 2,
    // specifies how long a resource can stay idle in pool before being removed
    idleTimeoutMillis : 30000
     // if true, logs via console.log - can also be a function
    // log : true
});

/**
 * Base Model base class
 * @param {hash} attributes of model
 */
var Base = function(attributes){

    this.attributes = attributes;
};

/**
 * Public
 * class extends method, can be use inherits on Base
 * @param  {hash} hash   a new prototype of Model
 * @return {Function}    a new child Function
 */
Base.extend = function(hash){
    var F = function() {},
        parent = this,
        child = F;

    merge(child, parent);

    function ctor() {
        this.constructor = child;
    }

    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    merge(child.prototype, hash);
    child.__super__ = parent.prototype;
    return child;
};

/**
 * Public
 * Find a model through id
 * @param  {string}   id       [description]
 * @param  {Function} callback [description]
 */
Base.find = function(id, callback) {
    var self = this;
    pool.acquire(function(err, client){
        if (!err) {
            if (!(id == null || 'undefined' === typeof id)){
                client.get(id, self._queryCallBack(callback, client));
            } else {
                self._queryCallBack(callback, client)(true, null);
            }
        }
    });
};

/**
 * Public
 * create a persistence model object
 * @param  {string}   id         model id
 * @param  {hash}   attributes   model attributes
 * @param  {Function} callback   a success callback
 */
Base.create = function(id, attributes, callback) {
    var self = this;
    pool.acquire(function(err, client){
        if (!err){
            attributes.id = id;
            var str = JSON.stringify(attributes);
            client.set(id, str, self._writeCallBack(attributes, callback, client));
        }
    });
};

/**
 * Public
 * update a persistence model object
 * @param  {string}   id         model id
 * @param  {hash}   attributes   model attributes
 * @param  {Function} callback   a success callback
 */
Base.update = function(id, attributes, callback) {
    var self = this;
    pool.acquire(function(err, client){
        if (!err){
            attributes.id = id;
            var str = JSON.stringify(attributes);
            client.set(id, str, self._writeCallBack(attributes, callback, client));
        }
    });
};


/**
 * Public
 * destroy a persistence model object with id
 * @param  {string}   id         model id
 * @param  {Function} callback   a success callback
 */
Base.destroy = function(id, callback) {
    var self = this;
    pool.acquire(function(err, client){
        if (!err){
            client.del(id, self._deleteCallBack(callback, client));
        }
    });
};

Base.findOrCreate = function(id, attributes, callback) {
    var self = this;
    this.find(id, function(err, obj){
        if (obj == null) {
            self.create(id, attributes, callback);
        } else {
            callback(err, obj);
        }
    });
};


Base.prototype.destroy = function(callback) {
    var id = this.id,
        klass = this.constructor;

    pool.acquire(function(err, client){
        if (!err){
            client.del(id, klass._deleteCallBack(callback, client));
        }
    });
};

/**
 * Private
 * factory a model object with query callback
 * @param  {Function} callback real callback for user
 * @param  {redis}   client    redis connect handle in Pool
 */
Base._queryCallBack = function(callback, client) {
    var self = this;
    return function(err, reply){
        var result =  Base.parseJSON(reply),
            obj    =  result ? self.factory(result) : null;
        callback(err, obj);
        pool.release(client);
    };
};

/**
 * Private
 * client write callback method, produce a model object
 * @param  {hash}   attributes  a write to redis attributes
 * @param  {Function} callback   real callback of user
 * @param  {redis}   client     redis connect handle in Pool
 */
Base._writeCallBack = function(attributes, callback, client) {
    var self = this;
    return function(err, reply){
        var obj =  !err && 'OK' === reply && attributes ?  self.factory(attributes) : null;
        callback(err, obj);
        pool.release(client);
    };
};


/**
 * Private
 * client write callback method, produce a model object
 * @param  {hash}   attributes  a write to redis attributes
 * @param  {Function} callback   real callback of user
 * @param  {redis}   client     redis connect handle in Pool
 */
Base._deleteCallBack = function( callback, client) {
    return function(err, reply){

        var obj = !err && 'number' === typeof reply && reply > 0 ? reply: 0;
        callback(err, obj);
        pool.release(client);
    };
};

/**
 * Private
 * parse raw string to json object
 * @param  {string} reply redis raw string
 * @return {json}         convert a JSON object;
 */
Base.parseJSON = function(reply) {
    var result = null;
    if (reply && typeof reply === 'string') {
        try {
            result = JSON.parse(reply);
        } catch (e) {
            result = null;
        }
    }
    return result;
};

/**
 * Private
 * factory Object method
 * @param  {attr} attr  inital attributes of model
 * @return {Object}     Object instance of Model
 */
Base.factory = function(attr) {
    // console.log(new this.toString());
    return new Base(attr);
};

var __hasProp = {}.hasOwnProperty,
    merge = function(to, form) {
        // console.log(form);
        for (var key in form) {
            if (__hasProp.call(form, key)) {
                to[key] = form[key];
            }
        }
    };


exports.Base = Base;
