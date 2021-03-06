import 'babel-polyfill';
import request from 'supertest';
import server from '../../index';
import User from '../../models/user';
import Role from '../../models/role';
import Document from '../../models/document';
import mongoose from 'mongoose';

describe('documents/put', () => {
  let roleAccessDoc;
  let publicDoc;
  let privateDoc;
  let author;
  let adminUser;
  let regularUser;

  beforeEach(async () => {
    server; //start server
    //roles
    const regular = await Role.create({ title: 'regular' });
    const admin = await Role.create({ title: 'admin' });

    //users
    author = await User.create({
      name: { first: 'nnamdi', last: 'lawal' },
      email: '66nnamdi@mail.com',
      userName: '66nnamdi',
      password: 'sweetlove',
      role: regular._id
    });

    regularUser = await User.create({
      name: { first: 'regularUser', last: 'lawal' },
      email: 'regularUser@mail.com',
      userName: 'regularUser',
      password: 'sweetlove',
      role: regular._id
    });
    adminUser = await User.create({
      name: { first: 'admin', last: 'user' },
      email: 'adminUser@mail.com',
      userName: 'adminUser',
      password: 'sweetlove',
      role: regular._id
    });
    //documents
    roleAccessDoc = await Document.create({
      access: 'role',
      ownerId: author._id,
      title: 'role access document',
      content: 'Document',
      role: regular._id
    });

    publicDoc = await Document.create({
      access: 'public',
      ownerId: author._id,
      title: 'public document',
      content: 'Document',
      role: regular._id
    });

    privateDoc = await Document.create({
      access: 'private',
      ownerId: author._id,
      title: 'private document',
      content: 'Document',
      role: regular._id
    });

    //old document that is created  by author to already in db before test
  });

  afterEach(async () => {
    await server.close(); //close server
    await User.deleteMany({});
    await Role.deleteMany({});
    await Document.deleteMany({});
  });

  test('that 404 is returned if document is not in db', async () => {
    const res = await request(server).get(
      `/api/documents/${new mongoose.Types.ObjectId()}`
    );

    expect(res.status).toBe(404);
  }); //test end

  test('that if the document access is public it can be viewed by anyone', async () => {
    const res = await request(server).get(`/api/documents/${publicDoc._id}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('_id', publicDoc._id.toHexString());
  }); //test end

  test('that if the document access is set to role  it can be viewed by user with same role as author', async () => {
    const token = regularUser.generateToken();
    const res = await request(server)
      .get(`/api/documents/${roleAccessDoc._id}`)
      .set('x-auth-token', token);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('_id', roleAccessDoc._id.toHexString());
  }); //test end

  test('that if the document access is set to role  it can be viewed by an admin user', async () => {
    const token = adminUser.generateToken();
    const res = await request(server)
      .get(`/api/documents/${roleAccessDoc._id}`)
      .set('x-auth-token', token);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('_id', roleAccessDoc._id.toHexString());
  }); //test end

  test('that if the document access is set to role  it cannot be viewed by a user with different role from the author', async () => {
    const token = new User({
      role: new mongoose.Types.ObjectId()
    }).generateToken();
    const res = await request(server)
      .get(`/api/documents/${roleAccessDoc._id}`)
      .set('x-auth-token', token);

    expect(res.status).toBe(403);
    expect(res.body).not.toHaveProperty('title');
    expect(res.body).not.toHaveProperty('_id', roleAccessDoc._id.toHexString());
  }); //test end

  test('that if the document access is set to private  it can be viewed by the author', async () => {
    const token = author.generateToken();
    const res = await request(server)
      .get(`/api/documents/${privateDoc._id}`)
      .set('x-auth-token', token);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('_id', privateDoc._id.toHexString());
  }); //test end

  test('that private docs can oly be viewed by author', async () => {
    const token = adminUser.generateToken();
    const res = await request(server)
      .get(`/api/documents/${privateDoc._id}`)
      .set('x-auth-token', token);

    expect(res.status).toBe(403);
    expect(res.body).not.toHaveProperty('title');
    expect(res.body).not.toHaveProperty('_id', privateDoc._id.toHexString());
  }); //test end
}); //describe end
