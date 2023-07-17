import json
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

###### GLOBALS

majority = 3

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
    return {"id": user.id, "username": user.username, "password": user.password, "likedTracks": json.loads(user.likedTracks)}

# Add user
@app.route('/users', methods=['POST'])
def add_user():
    user = User(username=request.json['username'], password=request.json['password'], likedTracks=json.dumps([]))
    db.session.add(user)
    db.session.commit()
    return {"id": user.id, "username": user.username, "password": user.password}, 201

# Add track to user's liked tracks
@app.route('/users/<id>/addTrack/<trackId>', methods=['POST'])
def add_liked_track(id, trackId):
    user = User.query.get(id)
    if user is None:
        return {"Error": "User not found"}, 404
    # Check if track already exists inside user's liked tracks
    likedTracks = json.loads(user.likedTracks)
    for likedId in likedTracks:
        if likedId == trackId:
            return {"Error": "Track already liked by user"}, 400
    # Add track to user's liked tracks
    likedTracks.append(trackId)
    user.likedTracks = json.dumps(likedTracks)
    db.session.commit()
    return add_like(trackId, id)
    # return {"userId": user.id, "addedTrack": trackId}, 200

# Remove track from user's liked tracks
@app.route('/users/<id>/removeTrack/<trackId>', methods=['DELETE'])
def remove_liked_track(id, trackId):
    user = User.query.get(id)
    if user is None:
        return {"Error": "User not found"}, 404
    # Check if track already exists inside user's liked tracks
    likedTracks = json.loads(user.likedTracks)
    found = False
    for likedId in likedTracks:
        if likedId == trackId:
            found = True
            break
    if found:
        likedTracks.remove(trackId)
        user.likedTracks = json.dumps(likedTracks)
        db.session.commit()
        return remove_like(trackId, id)
        # return {"userId": user.id, "removedTrack": trackId}, 200
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

# Add a like from user
@app.route('/liked/add/<trackId>/<userId>', methods=['POST'])
def add_like(trackId, userId):
    userIdInt = int(userId)
    track = Liked.query.get(trackId)
    if track is None:
        # Create entry for this track
        newTrack = Liked(id=trackId, likedBy="[]")
        db.session.add(newTrack)
        db.session.commit()
        track = Liked.query.get(trackId)
    # Add user to track's likedBy
    users = json.loads(track.likedBy)
    if userIdInt in users:
        # User has already liked this song
        return {"Error": "User has already liked this song"}, 400
    users.append(userIdInt)
    track.likedBy = json.dumps(users)
    db.session.commit()
    # Check if track needs to be added to playlist
    if len(users) == majority:
        return {"trackId": trackId, "user": userIdInt, "status": "SUCCESS + ADD TO PLAYLIST"}, 250
    return {"trackId": trackId, "user": userIdInt, "status": "SUCCESS"}, 200

# Remove a like from user
@app.route('/liked/remove/<trackId>/<userId>', methods=['POST'])
def remove_like(trackId, userId):
    userIdInt = int(userId)
    track = Liked.query.get(trackId)
    if track is None:
        return {"Error": "Track not found in liked tracks"}, 400
    # Remove user from track's likedBy
    users = json.loads(track.likedBy)
    if userIdInt in users:
        users.remove(userIdInt)
        track.likedBy = json.dumps(users)
        db.session.commit()
        # Check if track needs to be removed from playlist
        if len(users) == (majority - 1):
            return {"trackId": trackId, "user": userIdInt, "status": "SUCCESS + REMOVE FROM PLAYLIST"}, 251
        return {"trackId": trackId, "user": userIdInt, "status": "SUCCESS"}, 200
    else:
        # User had not previously liked this song
        return {"Error": "User had not previously liked this song"}, 400

### AUTH

# Get tokens
@app.route('/auth/tokens')
def get_tokens():
    token = Auth.query.get(1)
    if token is None:
        return {"Error": "Tokens not found"}, 404
    return {"accessToken": token.accessToken, "refreshToken": token.refreshToken}, 200

# Set refresh token
@app.route('/auth/refreshToken', methods=['POST'])
def set_refresh_token():
    token = Auth.query.get(1)
    token.refreshToken = request.json['refreshToken']
    db.session.commit()
    return {'New refresh token': token.refreshToken}, 200

# Set access token
@app.route('/auth/accessToken', methods=['POST'])
def set_access_token():
    token = Auth.query.get(1)
    token.accessToken = request.json['accessToken']
    db.session.commit()
    return {'New access token': token.accessToken}, 200
