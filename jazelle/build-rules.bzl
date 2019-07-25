load("//:rules/jazelle.bzl", _jazelle = "jazelle")
load("//:rules/web-monorepo.bzl", _web_library = "web_library", _web_binary = "web_binary", _web_executable = "web_executable", _web_test = "web_test")
load("//:rules/flow.bzl", _flow_test = "flow_test")

jazelle = _jazelle
web_library = _web_library
web_binary = _web_binary
web_executable = _web_executable
web_test = _web_test
flow_test = _flow_test