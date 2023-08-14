import sys
import json
import requests
import base64
from flask import Flask, request, redirect
from flask_sqlalchemy import SQLAlchemy
app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

app.app_context().push()

class Album(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    albumID = db.Column(db.String(80), unique=True, nullable=False)
    name = db.Column(db.String(80), unique=False, nullable=False)
    artist = db.Column(db.String(80), unique=False, nullable=False)
    year = db.Column(db.String(80), unique=False, nullable=False)
    cover = db.Column(db.String(80), unique=False, nullable=False)
    ownerID = db.Column(db.Integer)
    tracks = db.Column(db.Text)

    def __repr__(self):
        return f"{self.id} - {self.albumID}"

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=False, nullable=False)
    password = db.Column(db.String(80), unique=False, nullable=False)
    likedTracks = db.Column(db.Text)

    def __repr__(self):
        return f"{self.id} - {self.username}"

class Auth(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    refreshToken = db.Column(db.Text)
    accessToken = db.Column(db.Text)

class Liked(db.Model):
    # id = db.Column(db.Integer, primary_key=True)
    id = db.Column(db.String(80), primary_key=True)
    likedBy = db.Column(db.Text)

class Cookie(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    userId = db.Column(db.Integer, nullable=False)
    os = db.Column(db.Text, nullable=False)
    key = db.Column(db.Text, nullable=False)

###### GLOBALS

playlistId = "3Z9UoDIlecIROC1I6HYG91"
clientId = "9cb9b55a9f4f402a8a250030f7c35468"
clientSecret = "e7a704cc2a4341279936c2feaee4cbe6"
majority = 2
invalidUsers = [8]

###### FUNCTIONS

def isTrackInPlaylist(id, token):
    url = 'https://api.spotify.com/v1/playlists/' + playlistId
    headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token}
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        for track in data['tracks']['items']:
            if track == id:
                return True
        return False
    else:
        return True

def addToPlaylist(trackId):
    accessToken = get_access_token()
    if accessToken == -1:
        return False
    else:
        duplicateTrack = isTrackInPlaylist(trackId, accessToken)
        if duplicateTrack == False:
            # Add to playlist
            url = 'https://api.spotify.com/v1/playlists/' + playlistId + '/tracks'
            headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken}
            payload = {'uris': ['spotify:track:' + trackId], 'position': 0}
            response = requests.post(url, headers=headers, json=payload)
            if response.status_code == 201:
                return True
        return True

def removeFromPlaylist(trackId):
    accessToken = get_access_token()
    if accessToken == -1:
        return False
    else:
        # Delete from Playlist
        url = 'https://api.spotify.com/v1/playlists/' + playlistId + '/tracks'
        headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken}
        payload = {'tracks': [{'uri': 'spotify:track:' + trackId}]}
        response = requests.delete(url, headers=headers, json=payload)
        if response.status_code == 200:
            return True
        return False

def validUserCount(users):
    count = 0
    for user in users:
        if user not in invalidUsers:
            count += 1
    return count

###### ROUTES

# Redirect to index.html
@app.route('/')
def index():
    return redirect("index.html", code=302)

### ALBUMS

# Get all selected albums
@app.route('/selectedAlbums')
def get_selected_albums():
    albums = Album.query.all()

    output = []
    for album in albums:
        album_data = {
            'id': album.id,
            'albumID': album.albumID,
            'name': album.name,
            'artist': album.artist,
            'year': album.year,
            'cover': album.cover,
            'ownerID': album.ownerID,
            'tracks': json.loads(album.tracks)
            }
        output.append(album_data)

    return {"albums" : output}

# Add an album
@app.route('/selectedAlbums', methods=['POST'])
def add_selected_album():
    album = Album(
        albumID=request.json['albumID'],
        name=request.json['name'],
        artist=request.json['artist'],
        year=request.json['year'],
        cover=request.json['cover'],
        ownerID=request.json['ownerID'],
        tracks=json.dumps(request.json['tracks'])
        )
    if Album.query.filter_by(albumID=album.albumID).first() is None:
        db.session.add(album)
        db.session.commit()
        return {'id': album.id, 'albumID': album.albumID}
    else:
        return {"error": "Album already selected"}

# Remove an album from selected
@app.route('/selectedAlbums/<id>', methods=['DELETE'])
def remove_selected_album(id):
    album = Album.query.filter_by(albumID=id).first()
    if album is None:
        return {"error": "Album not found"}, 404
    db.session.delete(album)
    db.session.commit()
    return {"Album successfully removed": id}, 200

### USERS

# Get all users
@app.route('/users')
def get_users():
    users = User.query.all()

    output = []
    for user in users:
        user_data = {
            'id': user.id,
            'username': user.username,
            'password': user.password
            }
        output.append(user_data)

    return {"users" : output}

# Get individual user
@app.route('/users/<name>')
def get_user(name):
    user = User.query.filter_by(username=name).first()
    if user is None:
        return {"Error": "User not found"}, 404
    return {"id": user.id, "username": user.username, "password": user.password, "likedTracks": json.loads(user.likedTracks)}, 200

@app.route('/users/<id>')
def get_user_by_id(id):
    user = User.query.get(id)
    if user is None:
        return {"Error": "User not found"}, 404
    return {"id": user.id, "username": user.username, "password": user.password, "likedTracks": json.loads(user.likedTracks)}, 200

# Add user
@app.route('/users', methods=['POST'])
def add_user():
    user = User(username=request.json['username'], password=request.json['password'], likedTracks=json.dumps([]))
    db.session.add(user)
    db.session.commit()
    return {"id": user.id, "username": user.username, "password": user.password}, 201

# FULL add like to track (USER + LIKED + PLAYLIST) -> All or nothing transaction
@app.route('/users/<id>/addTrackFull/<trackId>', methods=['POST'])
def add_liked_track_full(id, trackId):
    # Check if user exists
    user = User.query.get(id)
    if user is None:
        return {"Error": "User not found"}, 404
    # Check if track already exists inside user's liked tracks
    likedTracks = json.loads(user.likedTracks)
    for likedId in likedTracks:
        if likedId == trackId:
            return {"Error": "Track already liked by user"}, 400
    # Check if there is an entry for this track in LIKED
    track = Liked.query.get(trackId)
    if track is None:
        # Create entry for this track
        newTrack = Liked(id=trackId, likedBy="[]")
        db.session.add(newTrack)
        db.session.commit()
        track = Liked.query.get(trackId)
    # Check if track needs to be added to playlist
    users = json.loads(track.likedBy)
    if user.id not in invalidUsers and validUserCount(users) == (majority - 1):
        # Add to playlist
        addSuccess = addToPlaylist(trackId)
        if addSuccess == False:
            return {"Error": "Unable to add track to playlist"}, 400
    # USER table update
    likedTracks.append(trackId)
    user.likedTracks = json.dumps(likedTracks)
    # LIKED table update
    userIdInt = int(id)
    users.append(userIdInt)
    track.likedBy = json.dumps(users)
    db.session.commit()
    return {"trackId": trackId, "user": userIdInt, "status": "POST SUCCESS"}, 200

# Remove track from user's liked tracks FULL
@app.route('/users/<id>/removeTrackFull/<trackId>', methods=['DELETE'])
def remove_liked_track_full(id, trackId):
    user = User.query.get(id)
    if user is None:
        return {"Error": "User not found"}, 404
    # Check if track exists inside user's liked tracks
    likedTracks = json.loads(user.likedTracks)
    found = False
    for likedId in likedTracks:
        if likedId == trackId:
            found = True
            break
    if found:
        track = Liked.query.get(trackId)
        users = json.loads(track.likedBy)
        if user.id not in invalidUsers and validUserCount(users) == majority:
            removeSuccess = removeFromPlaylist(trackId)
            if removeSuccess == False:
                return {"Error": "Unable to remove track from playlist"}, 400
        # Update USER table
        likedTracks.remove(trackId)
        user.likedTracks = json.dumps(likedTracks)
        # Update LIKED table
        userIdInt = int(id)
        if userIdInt in users:
            users.remove(userIdInt)
            track.likedBy = json.dumps(users)
        else:
            return {"Error": "User had not previously liked this song"}, 400
        # Commit changes
        db.session.commit()
        return {"trackId": trackId, "user": userIdInt, "status": "DELETE SUCCESS"}, 200
    else:
        return {"Error": "Could not remove. Track was not found on user likedTracks."}, 400

### LIKED TRACKS

# Get all liked tracks
@app.route('/liked')
def get_all_liked():
    allTracks = Liked.query.all()

    output = []
    for track in allTracks:
        track_data = {
            'id': track.id,
            'likedBy': json.loads(track.likedBy)
            }
        output.append(track_data)

    return {"likedTracks" : output}

### AUTH

def get_access_token():
    currentAuthTokens = Auth.query.get(1)
    if currentAuthTokens is None:
        return -1
    accessToken = currentAuthTokens.accessToken
    refreshToken = currentAuthTokens.refreshToken
    # Check if access token is alive
    url = 'https://api.spotify.com/v1/tracks/11dFghVXANMlKmJXsNCbNl'
    headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken}
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return accessToken
    # Get new acccess token
    auth_message = clientId + ':' + clientSecret
    auth_message_bytes = auth_message.encode('ascii')
    base64_bytes = base64.b64encode(auth_message_bytes)
    base64_auth_message = base64_bytes.decode('ascii')
    url = 'https://accounts.spotify.com/api/token'
    headers = {'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': 'Basic ' + base64_auth_message}
    payload = {'grant_type': 'refresh_token', 'refresh_token': refreshToken}
    response = requests.post(url, headers=headers, params=payload)
    if response.status_code == 200:
        data = response.json()
        newToken = data['access_token']
        currentAuthTokens.accessToken = newToken
        db.session.commit()
        return newToken
    else:
        return -1

# Get working token
@app.route('/auth/accessToken')
def get_active_access_token():
    token = get_access_token()
    if token != -1:
        return {"accessToken": token}, 200
    else:
        return {"Error": "Could not retrieve valid access token"}, 400

### COOKIES

# Set a cookie
@app.route('/cookies/set/<id>/<value>', methods=['POST'])
def set_login_cookie(id, value):
    user = User.query.get(id)
    if user is None:
        return {"Error": "User not found"}, 400
    operatingSystem = value.split(":")[0]
    cookieKey = value.split(":")[1]
    existingCookie = Cookie.query.filter_by(userId=id, os=operatingSystem).first()
    if existingCookie is None:
        cookie = Cookie(userId=id, os=operatingSystem, key=cookieKey)
        db.session.add(cookie)
        db.session.commit()
        return {"User": id, "Cookie": value, "Action": "Cookie created"}, 200
    else:
        existingCookie.key = cookieKey
        db.session.commit()
        return {"User": id, "Cookie": value, "Action": "Cookie updated"}, 200

@app.route('/cookies/login/<value>')
def request_cookie_login(value):
    operatingSystem = value.split(":")[0]
    cookieKey = value.split(":")[1]
    cookie = Cookie.query.filter_by(os=operatingSystem, key=cookieKey).first()
    if cookie is None:
        return {"Error": "No user associated with that cookie"}, 400
    return get_user_by_id(cookie.userId)
