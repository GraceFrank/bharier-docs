import 'babel-polyfill';
import Role from '../../models/role';
import request from 'supertest';
import server from '../../index';
import User from '../../models/user';

let adminUser;
let regularUser;
let admin;
let regular;
//test Creating a role
describe('Roles, /', () => {
  beforeEach(async () => {
    server; //start server
    await Role.insertMany([{ title: 'regular' }, { title: 'admin' }]);
    regular = await Role.findOne({ title: 'regular' });
    admin = await Role.findOne({ title: 'admin' });

    regularUser = await User.create({
      name: { first: 'user1', last: 'solomon' },
      email: 'user30@mail.com',
      userName: 'user30',
      password: 'sweetlove',
      role: regular._id
    });
    adminUser = await User.create({
      name: { first: 'user2', last: 'solomon' },
      email: 'user23@mail.com',
      userName: 'user23',
      password: 'sweetlove',
      role: admin._id
    });
  });

  afterEach(async () => {
    await server.close(); //close server
    await Role.deleteMany({}); //empty roles collection in db
    await User.deleteMany({});
  });

  describe('POST/ ', () => {
    //test that a role must have title
    test('that the created role has title property', async () => {
      const token = new User({ role: admin._id }).generateToken();
      const res = await request(server)
        .post('/api/roles')
        .set('x-auth-token', token)
        .send({ title: 'premium' });
      expect(res.body).toHaveProperty('title');
    }); //test end

    //test that if title is not provided, role should not be created
    test('roles with empty title cannot be created', async () => {
      const token = new User({ role: admin._id }).generateToken();
      const res = await request(server)
        .post('/api/roles')
        .set('x-auth-token', token)
        .send({ title: '' });
      expect(res.status).toBe(400);
    }); //test end

    test('roles without title cannot be created', async () => {
      const token = new User({ role: admin._id }).generateToken();
      const res = await request(server)
        .post('/api/roles')
        .set('x-auth-token', token)
        .send({});
      expect(res.status).toBe(400);
    }); //test end

    //test that admin and regular roles exist
    test('that admin role exist on the system', async () => {
      const admin = await Role.findOne({ title: 'admin' });
      expect(admin).toBeTruthy();
      expect(admin).toHaveProperty('title');
    }); //test end

    test('that regular role exist on the system', async () => {
      const user = await Role.findOne({ title: 'regular' });
      expect(user).toBeTruthy();
      expect(user).toHaveProperty('title');
    }); //test end

    //test that role title is unique
    test('that title is unique', async () => {
      const token = new User({ role: admin._id }).generateToken();
      const res = await request(server)
        .post('/api/roles')
        .set('x-auth-token', token)
        .send({ title: 'admin' });
      expect(res.status).toBe(400);
      expect(res.body.title).not.toBeTruthy();
    });

    //test that a only admin can create  a user
    test('that a non admin cant create a role', async () => {
      const token = new User({ role: regular._id }).generateToken();
      const res = await request(server)
        .post('/api/roles')
        .set('x-auth-token', token)
        .send({ title: 'premium' });
      expect(res.status).toBe(403);
    }); //test end
  }); //end of describe (POST)
}); //end of describe (Roles)

//test that role can only be created, updated and deleted by admin
//roles can be viewed (admin will not be visible)
