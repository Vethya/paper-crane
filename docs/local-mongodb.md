# MongoDB for local development

Use a replica set for development. Renaming or deleting a tag changes the tag and its references in saved resumes in one transaction. A standalone MongoDB server can handle basic reads and writes, but those tag operations will fail.

## Run MongoDB with Docker

Start Docker, then run the following commands once to create a local MongoDB 8.0 replica set:

```bash
docker run --detach --name resume-manager-mongo \
  --publish 127.0.0.1:27017:27017 \
  --volume resume-manager-mongo-data:/data/db \
  mongo:8.0 --replSet rs0 --bind_ip_all

docker exec resume-manager-mongo mongosh --quiet --eval \
  'rs.initiate({_id: "rs0", members: [{_id: 0, host: "localhost:27017"}]})'
```

If the second command gets a connection error, wait for MongoDB to start and run it again. Check that the replica set is ready to accept writes:

```bash
docker exec resume-manager-mongo mongosh --quiet --eval 'db.hello().isWritablePrimary'
```

Wait for `true` before starting the app. Add this to `.env.local`:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/resume-manager?replicaSet=rs0&directConnection=true
```

Use `docker stop resume-manager-mongo` when you finish and `docker start resume-manager-mongo` to resume. The Docker volume keeps your development data between sessions.

## Use MongoDB Atlas

A [Free cluster](https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/) also supports the development workflow. Create a database user with read/write access to `resume-manager`, add your current IP to the project access list, and copy the [Node.js driver connection string](https://www.mongodb.com/docs/atlas/driver-connection/). Replace the credential placeholders and put `/resume-manager` between the host and query string. Use the result as `MONGODB_URI` in `.env.local`.

## Check saved resume tags

Sign in and attach a tag to a saved sample resume. Rename the tag and reload the resume to confirm it shows the new name. Delete the tag and reload again to confirm the reference is gone.
